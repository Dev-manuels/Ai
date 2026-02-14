export interface IngestionProvider {
  name: string;
  getLeagues(): Promise<any[]>;
  getFixtures(leagueId: number, season: number): Promise<any[]>;
  getOdds(fixtureId: number): Promise<any[]>;
}
