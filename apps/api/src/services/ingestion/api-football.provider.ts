import { IngestionProvider } from './provider.interface';

export class ApiFootballProvider implements IngestionProvider {
  name = 'API-Football';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLeagues() {
    // Simulated API response from API-Football
    return [
      { id: 39, name: 'Premier League', country: 'England' },
      { id: 140, name: 'La Liga', country: 'Spain' }
    ];
  }

  async getFixtures(leagueId: number, season: number) {
    return [
      { id: 12345, date: new Date(), home: 'Arsenal', away: 'Liverpool', status: 'NS' }
    ];
  }

  async getOdds(fixtureId: number) {
    return [
      { bookmaker: 'Pinnacle', home: 2.1, draw: 3.4, away: 3.6 }
    ];
  }
}
