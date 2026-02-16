import prisma from '@football/database';
import { IngestionProvider } from '@football/ingestion';
import { PredictionService } from '../ml/prediction.service';

export class IngestionService {
  private predictionService: PredictionService;

  constructor(private provider: IngestionProvider) {
    this.predictionService = new PredictionService();
  }

  private async getOrCreateMapping(externalId: number | string, entityType: string, createInternal: () => Promise<string>): Promise<string> {
    const mapping = await prisma.providerMapping.findUnique({
      where: {
        providerName_externalId_entityType: {
          providerName: this.provider.name,
          externalId: String(externalId),
          entityType
        }
      }
    });

    if (mapping) {
      return mapping.internalId;
    }

    // Check if we already have an internal entity for this (e.g. from another provider)
    // This is the "Mapping" part. For now, we assume if it's new to this provider, it's a new entity
    // In a real scenario, we might want to match by name/country etc.

    const internalId = await createInternal();

    await prisma.providerMapping.create({
      data: {
        internalId,
        externalId: String(externalId),
        providerName: this.provider.name,
        entityType
      }
    });

    return internalId;
  }

  async syncLeagues() {
    const leagues = await this.provider.getLeagues();
    for (const l of leagues) {
      await this.getOrCreateMapping(l.externalId, 'LEAGUE', async () => {
        // Try to find if it exists by name and country to avoid duplicates if possible
        const existing = await prisma.league.findFirst({
          where: { name: l.name, country: l.country }
        });
        if (existing) return existing.id;

        const created = await prisma.league.create({
          data: {
            externalId: typeof l.externalId === 'number' ? l.externalId : 0, // Fallback for legacy field
            name: l.name,
            country: l.country
          }
        });
        return created.id;
      });
    }
  }

  async syncTeams(leagueId: number, season: number) {
    const teams = await this.provider.getTeams(leagueId, season);
    for (const t of teams) {
      await this.getOrCreateMapping(t.externalId, 'TEAM', async () => {
        const existing = await prisma.team.findFirst({
          where: { name: t.name }
        });
        if (existing) return existing.id;

        const created = await prisma.team.create({
          data: {
            externalId: typeof t.externalId === 'number' ? t.externalId : 0,
            name: t.name
          }
        });
        return created.id;
      });
    }
  }

  async syncFixtures(leagueId: number, season: number) {
    const fixtures = await this.provider.getFixtures(leagueId, season);

    // Get internal league ID
    const internalLeagueId = await this.getOrCreateMapping(leagueId, 'LEAGUE', async () => {
       throw new Error(`League ${leagueId} not found. Sync leagues first.`);
    });

    for (const f of fixtures) {
      const homeTeamId = await this.getOrCreateMapping(f.homeTeamId, 'TEAM', async () => {
        throw new Error(`Home team ${f.homeTeamId} not found. Sync teams first.`);
      });
      const awayTeamId = await this.getOrCreateMapping(f.awayTeamId, 'TEAM', async () => {
        throw new Error(`Away team ${f.awayTeamId} not found. Sync teams first.`);
      });

      const fixtureId = await this.getOrCreateMapping(f.externalId, 'FIXTURE', async () => {
        const created = await prisma.fixture.create({
          data: {
            externalId: typeof f.externalId === 'number' ? f.externalId : 0,
            date: f.date,
            leagueId: internalLeagueId,
            homeTeamId: homeTeamId,
            awayTeamId: awayTeamId,
            status: f.status,
            homeScore: f.homeScore,
            awayScore: f.awayScore
          }
        });
        return created.id;
      });

      // Trigger prediction for the fixture (asynchronously)
      this.predictionService.generatePrediction(fixtureId).catch(err => {
        console.error(`Post-sync prediction failed for ${fixtureId}:`, err);
      });
    }
  }
}
