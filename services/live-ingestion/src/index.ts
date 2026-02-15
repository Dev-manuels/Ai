import dotenv from 'dotenv';
import { LiveStreamProducer } from './redis.producer';
import { LiveEvent, LiveOdds } from './provider.interface';
import { LiveEventPersistor } from './persistor';
import { ProviderFactory } from '@football/ingestion';
import { PollingLiveProvider } from './polling.provider';

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

    const providerType = process.env.FOOTBALL_PROVIDER || 'mock';
    const provider = ProviderFactory.getProvider(providerType);

    if (providerType === 'mock') {
        this.startSimulation();
    } else {
        // In a real scenario, we would get active fixtures from DB
        const liveProvider = new PollingLiveProvider(provider, 12345, 'fixture-123', 10000);
        liveProvider.onEvent(async (e) => await this.producer.publishEvent(e));
        liveProvider.onOdds(async (o) => await this.producer.publishOdds(o));
        await liveProvider.connect();
        console.log(`Started polling live data from ${provider.name}`);
    }
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

    // Simulate odds movement with depth ladders
    setInterval(async () => {
      const generateDepth = (baseOdds: number) => {
        const levels = 5;
        const depth = [];
        for (let i = 0; i < levels; i++) {
          // Power-law/Exponential decay simulation for volume
          // Volume decreases as we move away from best price
          const price = baseOdds - (i * 0.02); // Simplified: slightly worse odds for larger volume
          const volume = 1000 * Math.pow(0.6, i); // Exponential decay
          depth.push({ price: Math.max(1.01, price), volume });
        }
        return depth;
      };

      const selections = [
        { name: 'home', base: 1.8 + Math.random() * 0.1 },
        { name: 'draw', base: 3.4 + Math.random() * 0.2 },
        { name: 'away', base: 4.5 + Math.random() * 0.5 }
      ];

      const odds: LiveOdds = {
        fixtureId,
        bookmaker: 'Betfair',
        market: '1X2',
        values: selections.map(s => ({
          selection: s.name,
          odds: s.base,
          depth: generateDepth(s.base)
        })),
        timestamp: Date.now()
      };
      await this.producer.publishOdds(odds);
      console.log('Published simulated depth ladder update');
    }, 3000);
  }
}

const manager = new LiveIngestionManager();
manager.start().catch(console.error);
