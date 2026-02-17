import prisma from '@football/database';
import { MLClient } from './ml.client';
import { IngestionProvider, NormalizedOdds } from '@football/ingestion';

export class PredictionService {
  private mlClient: MLClient;

  constructor() {
    this.mlClient = new MLClient();
  }

  async generatePrediction(fixtureId: string, provider?: IngestionProvider) {
    console.log(`[PredictionService] Triggering multi-market inference for Fixture ${fixtureId}`);
    try {
      const fixture = await prisma.fixture.findUnique({
        where: { id: fixtureId },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true
        }
      });

      if (!fixture) {
        throw new Error(`Fixture ${fixtureId} not found`);
      }

      // Check if prediction already exists to prevent duplicates
      const existingCount = await prisma.prediction.count({
        where: { fixtureId }
      });

      if (existingCount > 0) {
        console.warn(`[PredictionService] ${existingCount} predictions already exist for Fixture ${fixtureId}, skipping.`);
        return;
      }

      // Fetch Odds if provider is available
      let odds: NormalizedOdds[] = [];
      if (provider) {
        try {
          const mapping = await prisma.providerMapping.findFirst({
            where: { internalId: fixtureId, entityType: 'FIXTURE', providerName: provider.name }
          });
          if (mapping) {
            odds = await provider.getOdds(parseInt(mapping.externalId));
          }
        } catch (error) {
          console.error(`[PredictionService] Failed to fetch odds for Fixture ${fixtureId}:`, error);
        }
      }

      let mlResponse;
      try {
        mlResponse = await this.mlClient.getPrediction(
          fixture.homeTeam.name,
          fixture.awayTeam.name
        );
      } catch (mlError: any) {
        console.error(`[PredictionService] ML Service unreachable or failed for Fixture ${fixtureId}:`, mlError.message);
        return;
      }

      const { markets, snapshot } = mlResponse;
      if (!markets) {
        console.error(`[PredictionService] No markets found in ML response for Fixture ${fixtureId}`);
        return;
      }

      const modelVersion = snapshot?.model_type || 'v1.0.0-stable';
      const predictionsToCreate = [];

      for (const [marketType, selections] of Object.entries(markets)) {
        for (const [selection, probability] of Object.entries(selections as any)) {
          const prob = probability as number;
          const fairOdds = 1 / prob;

          const marketOddsValue = this.findMarketOdds(marketType, selection, odds);
          const ev = marketOddsValue ? (prob * marketOddsValue) - 1 : null;

          predictionsToCreate.push({
            fixtureId: fixture.id,
            marketType,
            selection,
            probability: prob,
            fairOdds,
            marketOdds: marketOddsValue,
            ev,
            confidence: prob,
            modelVersion,
            featureSnapshot: snapshot as any
          });
        }
      }

      if (predictionsToCreate.length > 0) {
        await prisma.prediction.createMany({
          data: predictionsToCreate
        });
        console.log(`[PredictionService] Successfully persisted ${predictionsToCreate.length} predictions for ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
      }

      return predictionsToCreate;
    } catch (error: any) {
      console.error(`[PredictionService] CRITICAL ERROR for fixture ${fixtureId}:`, error.message);
    }
  }

  private findMarketOdds(marketType: string, selection: string, odds: NormalizedOdds[]): number | null {
    const marketMap: Record<string, string> = {
      '1X2': 'Match Winner',
      'OVER_UNDER_2_5': 'Goals Over/Under',
      'BTTS': 'Both Teams Score',
      'HOME_OVER_UNDER_1_5': 'Home Team Over/Under',
      'AWAY_OVER_UNDER_1_5': 'Away Team Over/Under'
    };

    const targetMarket = marketMap[marketType];
    if (!targetMarket) return null;

    const marketData = odds.find(o => o.market === targetMarket);
    if (!marketData) return null;

    const selectionMap: Record<string, string[]> = {
      'HOME': ['Home', '1'],
      'DRAW': ['Draw', 'X'],
      'AWAY': ['Away', '2'],
      'OVER': ['Over 2.5', 'Over 1.5', 'Over 0.5', 'Over'],
      'UNDER': ['Under 2.5', 'Under 1.5', 'Under 0.5', 'Under'],
      'YES': ['Yes', 'BTTS Yes'],
      'NO': ['No', 'BTTS No']
    };

    const possibleSelections = selectionMap[selection] || [selection];
    const match = marketData.values.find(v => possibleSelections.includes(v.selection));

    return match ? match.odds : null;
  }
}
