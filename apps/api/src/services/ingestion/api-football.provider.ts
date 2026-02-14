import { IngestionProvider } from './provider.interface';

export class ApiFootballProvider implements IngestionProvider {
  name = 'API-Football';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLeagues() {
    return []; // Implementation placeholder
  }

  async getFixtures(leagueId: number, season: number) {
    return [];
  }

  async getOdds(fixtureId: number) {
    return [];
  }
}
