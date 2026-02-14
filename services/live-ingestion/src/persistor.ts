import { createClient, commandOptions } from 'redis';

export class LiveEventPersistor {
  private redis;
  private prisma: any;
  private buffer: any[] = [];
  private readonly bufferLimit = 100;
  private readonly eventStream = 'live_events';
  private readonly oddsStream = 'live_odds';
  private readonly groupName = 'persistor_group';
  private readonly consumerName = 'persistor_1';

  constructor(redisUrl: string) {
    this.redis = createClient({ url: redisUrl });
    try {
      const { PrismaClient } = require('@prisma/client');
      this.prisma = new PrismaClient();
    } catch (e) {
      this.prisma = null;
    }
  }

  async connect() {
    await this.redis.connect();
    try {
      await this.redis.xGroupCreate(this.eventStream, this.groupName, '0', { MKSTREAM: true });
    } catch (e) {}
    try {
      await this.redis.xGroupCreate(this.oddsStream, this.groupName, '0', { MKSTREAM: true });
    } catch (e) {}
  }

  private async flushBuffer() {
    if (this.buffer.length === 0) return;
    const dataToSave = [...this.buffer];
    this.buffer = [];

    try {
      await (this.prisma as any).inPlayOdds.createMany({
        data: dataToSave
      });
      console.log(`Flushed ${dataToSave.length} odds to DB`);
    } catch (e) {
      console.error('Flush Error:', e);
      // Put back to buffer on failure (simplified)
      this.buffer = [...dataToSave, ...this.buffer].slice(0, 1000);
    }
  }

  async run() {
    console.log('Live Event Persistor running...');
    while (true) {
      try {
        const results = await this.redis.xReadGroup(
          commandOptions({ isolated: true }),
          this.groupName,
          this.consumerName,
          [
            { key: this.eventStream, id: '>' },
            { key: this.oddsStream, id: '>' }
          ],
          { COUNT: 10, BLOCK: 5000 }
        );

        if (results) {
          for (const stream of (results as any)) {
            const key = stream.name;
            for (const message of stream.messages) {
              if (key === this.eventStream) {
                await (this.prisma as any).matchEvent.create({
                  data: {
                    fixtureId: message.message.fixtureId as string,
                    type: message.message.type as string,
                    timestamp: new Date(parseInt(message.message.timestamp as string)),
                    data: JSON.parse(message.message.data as string)
                  }
                });
              } else if (key === this.oddsStream) {
                this.buffer.push({
                  fixtureId: message.message.fixtureId as string,
                  bookmaker: message.message.bookmaker as string,
                  market: message.message.market as string,
                  values: JSON.parse(message.message.values as string),
                  timestamp: new Date(parseInt(message.message.timestamp as string))
                });

                if (this.buffer.length >= this.bufferLimit) {
                  await this.flushBuffer();
                }
              }
              await this.redis.xAck(key, this.groupName, message.id);
            }
          }
        }
      } catch (error) {
        console.error('Persistor Error:', error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
