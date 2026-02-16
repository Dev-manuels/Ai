import prisma from '@football/database';
import { MLClient } from './ml.client';

export class PredictionService {
  private mlClient: MLClient;

  constructor() {
    this.mlClient = new MLClient();
  }

  async generatePrediction(fixtureId: string) {
    console.log(`[PredictionService] Triggering inference for Fixture ${fixtureId}`);
    try {
      const fixture = await prisma.fixture.findUnique({
        where: { id: fixtureId },
        include: {
          homeTeam: true,
          awayTeam: true
        }
      });

      if (!fixture) {
        throw new Error(`Fixture ${fixtureId} not found`);
      }

      // Check if prediction already exists to prevent overwriting after settlement/user decision
      const existing = await prisma.prediction.findFirst({
        where: { fixtureId }
      });

      if (existing) {
        console.warn(`[PredictionService] Prediction already exists for Fixture ${fixtureId}, skipping to preserve integrity.`);
        return existing;
      }

      let mlResponse;
      try {
        mlResponse = await this.mlClient.getPrediction(
          fixture.homeTeam.name,
          fixture.awayTeam.name
        );
      } catch (mlError: any) {
        console.error(`[PredictionService] ML Service unreachable or failed for Fixture ${fixtureId}:`, mlError.message);
        // Fallback or retry logic could go here. For now, we log and abort to avoid invalid records.
        return;
      }

      // Save prediction to DB with all critical fields for edge analysis
      const prediction = await prisma.prediction.create({
        data: {
          fixtureId: fixture.id,
          modelVersion: mlResponse.snapshot?.model_type || 'v1.0.0-stable',
          homeProb: mlResponse.home_win,
          drawProb: mlResponse.draw,
          awayProb: mlResponse.away_win,
          ev: mlResponse.ev || 0.05, // Use EV from model if available
          confidence: mlResponse.confidence || 0.8,
          recommendedBet: this.deriveRecommendedBet(mlResponse),
          featureSnapshot: mlResponse.snapshot || { error: 'Snapshot missing' }
        }
      });

      console.log(`[PredictionService] Successfully persisted prediction for ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
      return prediction;
    } catch (error: any) {
      console.error(`[PredictionService] CRITICAL ERROR for fixture ${fixtureId}:`, error.message);
    }
  }

  private deriveRecommendedBet(mlResponse: any): string {
    const { home_win, draw, away_win } = mlResponse;
    if (home_win > draw && home_win > away_win) return 'HOME';
    if (away_win > draw && away_win > home_win) return 'AWAY';
    return 'DRAW';
  }
}
