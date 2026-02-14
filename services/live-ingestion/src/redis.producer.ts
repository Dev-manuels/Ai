import { createClient } from 'redis';
import { LiveEvent, LiveOdds } from './provider.interface';

export class LiveStreamProducer {
  private client;
  private readonly eventStream = 'live_events';
  private readonly oddsStream = 'live_odds';

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect() {
    await this.client.connect();
  }

  async publishEvent(event: LiveEvent) {
    await this.client.xAdd(this.eventStream, '*', {
      fixtureId: event.fixtureId,
      type: event.type,
      timestamp: event.timestamp.toString(),
      data: JSON.stringify(event.data)
    });
  }

  async publishOdds(odds: LiveOdds) {
    await this.client.xAdd(this.oddsStream, '*', {
      fixtureId: odds.fixtureId,
      bookmaker: odds.bookmaker,
      market: odds.market,
      values: JSON.stringify(odds.values),
      timestamp: odds.timestamp.toString()
    });
  }
}
