import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import {
  IngestionProvider,
  NormalizedLeague,
  NormalizedTeam,
  NormalizedFixture,
  NormalizedOdds,
  NormalizedEvent,
  NormalizedStats
} from '../provider.interface';

export class ApiFootballAdapter implements IngestionProvider {
  name = 'API-Football';
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      }
    });
  }

  async getLeagues(): Promise<NormalizedLeague[]> {
    const response = await this.client.get('/leagues');
    return response.data.response.map((item: any) => ({
      externalId: item.league.id,
      name: item.league.name,
      country: item.country.name,
      logo: item.league.logo
    }));
  }

  async getTeams(leagueId: number, season: number): Promise<NormalizedTeam[]> {
    const response = await this.client.get('/teams', { params: { league: leagueId, season } });
    return response.data.response.map((item: any) => ({
      externalId: item.team.id,
      name: item.team.name,
      logo: item.team.logo
    }));
  }

  async getFixtures(leagueId: number, season: number): Promise<NormalizedFixture[]> {
    const response = await this.client.get('/fixtures', { params: { league: leagueId, season } });
    return response.data.response.map((item: any) => ({
      externalId: item.fixture.id,
      date: new Date(item.fixture.date),
      leagueId: item.league.id,
      homeTeamId: item.teams.home.id,
      awayTeamId: item.teams.away.id,
      status: item.fixture.status.short,
      homeScore: item.goals.home,
      awayScore: item.goals.away
    }));
  }

  async getOdds(fixtureId: number): Promise<NormalizedOdds[]> {
    const response = await this.client.get('/odds', { params: { fixture: fixtureId } });
    return response.data.response.map((item: any) => ({
      fixtureId: item.fixture.id,
      bookmaker: item.bookmakers[0]?.name || 'Unknown',
      market: item.bookmakers[0]?.bets[0]?.name || 'Unknown',
      timestamp: new Date(item.update).getTime(),
      values: item.bookmakers[0]?.bets[0]?.values.map((v: any) => ({
        selection: v.value,
        odds: parseFloat(v.odds)
      })) || []
    }));
  }

  async getEvents(fixtureId: number): Promise<NormalizedEvent[]> {
    const response = await this.client.get('/fixtures/events', { params: { fixture: fixtureId } });
    return response.data.response.map((item: any) => ({
      fixtureId,
      type: item.type,
      timestamp: Date.now(), // API-Football events don't have absolute timestamp, usually just elapsed
      elapsed: item.time.elapsed,
      detail: item.detail,
      teamId: item.team.id,
      playerId: item.player.id
    }));
  }

  async getLineups(fixtureId: number): Promise<any> {
    const response = await this.client.get('/fixtures/lineups', { params: { fixture: fixtureId } });
    return response.data.response;
  }

  async getInjuries(fixtureId: number): Promise<any> {
    const response = await this.client.get('/fixtures/injuries', { params: { fixture: fixtureId } });
    return response.data.response;
  }

  async getStats(fixtureId: number): Promise<NormalizedStats[]> {
    const response = await this.client.get('/fixtures/statistics', { params: { fixture: fixtureId } });
    return response.data.response.map((item: any) => {
      const stats: Record<string, any> = {};
      item.statistics.forEach((s: any) => {
        stats[s.type] = s.value;
      });
      return {
        fixtureId,
        teamId: item.team.id,
        stats
      };
    });
  }
}
