import dotenv from 'dotenv';
import { LiveStreamProducer } from './redis.producer';
import { LiveEvent, LiveOdds } from './provider.interface';
import { LiveEventPersistor } from './persistor';

dotenv.config();

class LiveIngestionManager {
  private producer: LiveStreamProducer;
  private persistor: LiveEventPersistor;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.producer = new LiveStreamProducer(redisUrl);
    this.persistor = new LiveEventPersistor(redisUrl);
  }

  async start() {
    await this.producer.connect();
    await this.persistor.connect();
    console.log('Live Ingestion Service connected to Redis and DB');

    // Start persistor in background
    this.persistor.run().catch(console.error);

    // Here we would initialize actual providers like SportmonksWebSocketProvider
    // For now, we simulate events for the Match State Engine
    this.startSimulation();
  }

  private startSimulation() {
    console.log('Starting live event simulation...');
    const fixtureId = 'fixture-123';

    // Simulate a goal after 5 seconds
    setTimeout(async () => {
      const event: LiveEvent = {
        fixtureId,
        type: 'GOAL',
        timestamp: Date.now(),
        data: { team: 'home', score: [1, 0], elapsed: 15 }
      };
      await this.producer.publishEvent(event);
      console.log('Published simulated GOAL event');
    }, 5000);

    // Simulate odds movement
    setInterval(async () => {
      const odds: LiveOdds = {
        fixtureId,
        bookmaker: 'Pinnacle',
        market: '1X2',
        values: [
          { selection: 'home', odds: 1.8 + Math.random() * 0.1 },
          { selection: 'draw', odds: 3.4 + Math.random() * 0.2 },
          { selection: 'away', odds: 4.5 + Math.random() * 0.5 }
        ],
        timestamp: Date.now()
      };
      await this.producer.publishOdds(odds);
      console.log('Published simulated odds update');
    }, 3000);
  }
}

const manager = new LiveIngestionManager();
manager.start().catch(console.error);
