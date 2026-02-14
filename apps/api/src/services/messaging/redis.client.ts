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

  async subscribeToTasks(callback: (fixtureId: string) => Promise<void>) {
    while (true) {
      try {
        const result = await this.client.xRead(
          { key: 'prediction_tasks', id: '0' },
          { COUNT: 1, BLOCK: 5000 }
        );
        if (result && result.length > 0) {
          const { messages } = result[0];
          for (const message of messages) {
            await callback(message.data.fixtureId as string);
            await this.client.xAck('prediction_tasks', 'group1', message.id);
          }
        }
      } catch (error) {
        console.error('Redis Stream Error:', error);
      }
    }
  }
}
