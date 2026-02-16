import { IngestionProvider, NormalizedLeague, NormalizedTeam, NormalizedFixture, NormalizedOdds, NormalizedEvent, NormalizedStats } from '../provider.interface';

export class MockProvider implements IngestionProvider {
  name = 'MockProvider';

  async getLeagues(): Promise<NormalizedLeague[]> {
    return [
      { externalId: 1, name: 'Mock League 1', country: 'Mockland' },
      { externalId: 2, name: 'Mock League 2', country: 'Mockland' }
    ];
  }

  async getTeams(leagueId: number, season: number): Promise<NormalizedTeam[]> {
    return [
      { externalId: 101, name: 'Mock Team A' },
      { externalId: 102, name: 'Mock Team B' }
    ];
  }

  async getFixtures(leagueId: number, season: number): Promise<NormalizedFixture[]> {
    return [
      {
        externalId: 1001,
        date: new Date(),
        leagueId,
        homeTeamId: 101,
        awayTeamId: 102,
        status: 'NS'
      }
    ];
  }

  async getOdds(fixtureId: number): Promise<NormalizedOdds[]> {
    return [
      {
        fixtureId,
        bookmaker: 'MockBookie',
        market: 'Match Winner',
        timestamp: Date.now(),
        values: [
          { selection: 'Home', odds: 2.0 },
          { selection: 'Draw', odds: 3.5 },
          { selection: 'Away', odds: 4.0 }
        ]
      },
      {
        fixtureId,
        bookmaker: 'MockBookie',
        market: 'Goals Over/Under',
        timestamp: Date.now(),
        values: [
          { selection: 'Over 2.5', odds: 1.9 },
          { selection: 'Under 2.5', odds: 1.9 }
        ]
      },
      {
        fixtureId,
        bookmaker: 'MockBookie',
        market: 'Both Teams Score',
        timestamp: Date.now(),
        values: [
          { selection: 'Yes', odds: 1.8 },
          { selection: 'No', odds: 2.0 }
        ]
      },
      {
        fixtureId,
        bookmaker: 'MockBookie',
        market: 'Home Team Over/Under',
        timestamp: Date.now(),
        values: [
          { selection: 'Over 1.5', odds: 1.7 },
          { selection: 'Under 1.5', odds: 2.1 }
        ]
      },
      {
        fixtureId,
        bookmaker: 'MockBookie',
        market: 'Away Team Over/Under',
        timestamp: Date.now(),
        values: [
          { selection: 'Over 1.5', odds: 2.5 },
          { selection: 'Under 1.5', odds: 1.5 }
        ]
      }
    ];
  }

  async getEvents(fixtureId: number): Promise<NormalizedEvent[]> {
    return [
      {
        fixtureId,
        type: 'GOAL',
        timestamp: Date.now(),
        elapsed: 10,
        detail: 'Normal Goal',
        teamId: 101
      }
    ];
  }

  async getLineups(fixtureId: number): Promise<any> {
    return { fixtureId, lineups: [] };
  }

  async getInjuries(fixtureId: number): Promise<any> {
    return { fixtureId, injuries: [] };
  }

  async getStats(fixtureId: number): Promise<NormalizedStats[]> {
    return [
      { fixtureId, teamId: 101, stats: { possession: 55 } },
      { fixtureId, teamId: 102, stats: { possession: 45 } }
    ];
  }
}
