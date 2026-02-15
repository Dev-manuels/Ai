export interface NormalizedLeague {
  externalId: number;
  name: string;
  country: string;
  logo?: string;
}

export interface NormalizedTeam {
  externalId: number;
  name: string;
  logo?: string;
}

export interface NormalizedFixture {
  externalId: number;
  date: Date;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  status: string;
  homeScore?: number;
  awayScore?: number;
}

export interface NormalizedOdds {
  fixtureId: number;
  bookmaker: string;
  market: string;
  values: {
    selection: string;
    odds: number;
    depth?: { price: number; volume: number }[];
  }[];
  timestamp: number;
}

export interface NormalizedEvent {
  fixtureId: number;
  type: string; // GOAL, CARD, CORNER, SHOT, etc.
  timestamp: number;
  elapsed: number;
  detail: string;
  teamId?: number;
  playerId?: number;
  data?: any;
}

export interface NormalizedStats {
  fixtureId: number;
  teamId: number;
  stats: Record<string, any>;
}

export interface IngestionProvider {
  name: string;
  getLeagues(): Promise<NormalizedLeague[]>;
  getTeams(leagueId: number, season: number): Promise<NormalizedTeam[]>;
  getFixtures(leagueId: number, season: number): Promise<NormalizedFixture[]>;
  getOdds(fixtureId: number): Promise<NormalizedOdds[]>;
  getEvents(fixtureId: number): Promise<NormalizedEvent[]>;
  getLineups(fixtureId: number): Promise<any>;
  getInjuries(fixtureId: number): Promise<any>;
  getStats(fixtureId: number): Promise<NormalizedStats[]>;
}
