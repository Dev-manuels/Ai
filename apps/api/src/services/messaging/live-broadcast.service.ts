import { createClient, commandOptions } from 'redis';
import { Server } from 'socket.io';

export class LiveBroadcastService {
  private redis;
  private readonly predictionStream = 'live_predictions';
  private readonly signalStream = 'live_signals';
  private readonly groupName = 'api_broadcast_group';
  private readonly consumerName = 'api_1';

  constructor(redisUrl: string, private io: Server) {
    this.redis = createClient({ url: redisUrl });
  }

  async connect() {
    await this.redis.connect();
    try {
      await this.redis.xGroupCreate(this.predictionStream, this.groupName, '0', { MKSTREAM: true });
    } catch (e) {}
    try {
      await this.redis.xGroupCreate(this.signalStream, this.groupName, '0', { MKSTREAM: true });
    } catch (e) {}
  }

  async run() {
    console.log('Live Broadcast Service running...');
    while (true) {
      try {
        const results = await this.redis.xReadGroup(
          commandOptions({ isolated: true }),
          this.groupName,
          this.consumerName,
          [
            { key: this.predictionStream, id: '>' },
            { key: this.signalStream, id: '>' }
          ],
          { COUNT: 5, BLOCK: 5000 }
        );

        if (results) {
          for (const stream of (results as any)) {
            const key = stream.name;
            for (const message of stream.messages) {
              const fixtureId = message.message.fixtureId as string;

              if (key === this.predictionStream) {
                const probs = JSON.parse(message.message.probs as string);
                this.io.to(`fixture:${fixtureId}`).emit('prediction:update', { fixtureId, probs });
              } else if (key === this.signalStream) {
                const signal = JSON.parse(message.message.signal as string);
                const execution = JSON.parse(message.message.execution as string);
                this.io.emit('signal:new', { fixtureId, signal, execution });
              }

              await this.redis.xAck(key, this.groupName, message.id);
            }
          }
        }
      } catch (error) {
        console.error('Broadcast Error:', error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
