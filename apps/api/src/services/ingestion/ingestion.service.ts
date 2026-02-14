import prisma from '@football/database';
import { IngestionProvider } from './provider.interface';

export class IngestionService {
  constructor(private provider: IngestionProvider) {}

  async syncLeagues() {
    const leagues = await this.provider.getLeagues();
    for (const l of leagues) {
      await prisma.league.upsert({
        where: { externalId: l.id },
        update: { name: l.name, country: l.country },
        create: { externalId: l.id, name: l.name, country: l.country }
      });
    }
  }

  async syncFixtures(leagueId: number, season: number) {
    const fixtures = await this.provider.getFixtures(leagueId, season);
    // Sync logic for teams and fixtures
  }
}
