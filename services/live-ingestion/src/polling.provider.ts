import { IngestionProvider } from '@football/ingestion';
import { LiveIngestionProvider, LiveEvent, LiveOdds } from './provider.interface';

export class PollingLiveProvider implements LiveIngestionProvider {
  private eventCallback?: (event: LiveEvent) => void;
  private oddsCallback?: (odds: LiveOdds) => void;
  private interval?: NodeJS.Timeout;

  constructor(
    private provider: IngestionProvider,
    private fixtureId: number, // External ID
    private internalFixtureId: string,
    private pollIntervalMs: number = 30000
  ) {}

  async connect(): Promise<void> {
    this.interval = setInterval(() => this.poll(), this.pollIntervalMs);
    // Initial poll
    this.poll();
  }

  private async poll() {
    try {
      const events = await this.provider.getEvents(this.fixtureId);
      // In a real scenario, we would only emit NEW events
      for (const e of events) {
        if (this.eventCallback) {
          this.eventCallback({
            fixtureId: this.internalFixtureId,
            type: e.type as any,
            timestamp: e.timestamp,
            data: { ...e.data, elapsed: e.elapsed, detail: e.detail }
          });
        }
      }

      const odds = await this.provider.getOdds(this.fixtureId);
      for (const o of odds) {
        if (this.oddsCallback) {
          this.oddsCallback({
            fixtureId: this.internalFixtureId,
            bookmaker: o.bookmaker,
            market: o.market,
            values: o.values,
            timestamp: o.timestamp
          });
        }
      }
    } catch (error) {
      console.error('Error polling live data:', error);
    }
  }

  onEvent(callback: (event: LiveEvent) => void): void {
    this.eventCallback = callback;
  }

  onOdds(callback: (odds: LiveOdds) => void): void {
    this.oddsCallback = callback;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
