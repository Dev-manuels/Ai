import { createClient } from 'redis';

export class RedisMessaging {
  private client;

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect() {
    await this.client.connect();
  }

  async publishPredictionTask(fixtureId: string) {
    await this.client.xAdd('prediction_tasks', '*', { fixtureId });
  }

  async subscribeToPredictions(callback: (fixtureId: string) => void) {
    // Subscriber logic for background workers
  }
}
