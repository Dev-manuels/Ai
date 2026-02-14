import { createClient } from 'redis';

export class CacheService {
  private client;

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    await this.connect();
    await this.client.set(key, value, {
      EX: ttlSeconds
    });
  }

  async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async cachePrediction(fixtureId: string, prediction: any): Promise<void> {
    await this.set(`prediction:${fixtureId}`, JSON.stringify(prediction), 1800); // 30 mins
  }

  async getCachedPrediction(fixtureId: string): Promise<any | null> {
    const data = await this.get(`prediction:${fixtureId}`);
    return data ? JSON.parse(data) : null;
  }
}
