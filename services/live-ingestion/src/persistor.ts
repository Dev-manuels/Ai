import { createClient, commandOptions } from 'redis';
import { PrismaClient } from '@prisma/client';

export class LiveEventPersistor {
  private redis;
  private prisma: PrismaClient;
  private readonly eventStream = 'live_events';
  private readonly oddsStream = 'live_odds';
  private readonly groupName = 'persistor_group';
  private readonly consumerName = 'persistor_1';

  constructor(redisUrl: string) {
    this.redis = createClient({ url: redisUrl });
    this.prisma = new PrismaClient();
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
          for (const { key, messages } of results) {
            for (const message of messages) {
              if (key === this.eventStream) {
                await this.prisma.matchEvent.create({
                  data: {
                    fixtureId: message.data.fixtureId as string,
                    type: message.data.type as string,
                    timestamp: new Date(parseInt(message.data.timestamp as string)),
                    data: JSON.parse(message.data.data as string)
                  }
                });
              } else if (key === this.oddsStream) {
                await this.prisma.inPlayOdds.create({
                  data: {
                    fixtureId: message.data.fixtureId as string,
                    bookmaker: message.data.bookmaker as string,
                    market: message.data.market as string,
                    values: JSON.parse(message.data.values as string),
                    timestamp: new Date(parseInt(message.data.timestamp as string))
                  }
                });
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
