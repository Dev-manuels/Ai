import { createClient, commandOptions } from 'redis';

export class RedisMessaging {
  private client;
  private readonly streamName = 'prediction_tasks';
  private readonly groupName = 'group1';
  private readonly consumerName = 'api-consumer-1';

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect() {
    await this.client.connect();
    try {
      // Create consumer group, MKSTREAM ensures the stream exists
      await this.client.xGroupCreate(this.streamName, this.groupName, '0', { MKSTREAM: true });
    } catch (error: any) {
      if (!error.message.includes('BUSYGROUP')) {
        console.error('Redis Group Creation Error:', error);
      }
    }
  }

  async publishPredictionTask(fixtureId: string) {
    await this.client.xAdd(this.streamName, '*', { fixtureId });
  }

  async subscribeToTasks(callback: (fixtureId: string) => Promise<void>) {
    while (true) {
      try {
        // Read from group to track offsets automatically. 
        // '>' means only messages never delivered to other consumers.
        const result = await this.client.xReadGroup(
          commandOptions({ isolated: true }),
          this.groupName,
          this.consumerName,
          { key: this.streamName, id: '>' },
          { COUNT: 1, BLOCK: 5000 }
        );

        if (result && result.length > 0) {
          const { messages } = result[0];
          for (const message of messages) {
            try {
              await callback(message.data.fixtureId as string);
              // Acknowledge the message only after successful processing
              await this.client.xAck(this.streamName, this.groupName, message.id);
            } catch (procError) {
              console.error(`Error processing message ${message.id}:`, procError);
              // In production, we might move this to a dead letter queue or retry
            }
          }
        }
      } catch (error) {
        console.error('Redis Stream Subscription Error:', error);
        // Avoid tight loop on error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}
