import express from 'express';
import cors from 'cors';
import prisma from '@football/database';
import { CacheService } from './services/cache/cache.service';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import rateLimit from 'express-rate-limit';
import { apiKeyMiddleware } from './middleware/api-key.middleware';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { LiveBroadcastService } from './services/messaging/live-broadcast.service';
import { SettlementService } from './services/settlement/settlement.service';
import { IngestionService } from './services/ingestion/ingestion.service';
import { ProviderFactory } from '@football/ingestion';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});
const cacheService = new CacheService(process.env.REDIS_URL || 'redis://redis:6379');

// Prometheus Metrics
collectDefaultMetrics();
const httpRequestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', apiLimiter);

app.get('/api/fixtures', async (req, res) => {
  const { date, leagueId } = req.query;
  try {
    const targetDate = date ? new Date(String(date)) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const fixtures = await prisma.fixture.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        ...(leagueId ? { leagueId: String(leagueId) } : {})
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        predictions: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { date: 'asc' }
    });
    res.json(fixtures);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

app.get('/api/leagues', async (req, res) => {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

app.post('/api/fixtures/:id/save', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const saved = await prisma.savedFixture.create({
      data: { userId, fixtureId: id }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save fixture' });
  }
});

app.delete('/api/fixtures/:id/save', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await prisma.savedFixture.delete({
      where: { userId_fixtureId: { userId, fixtureId: id } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsave fixture' });
  }
});

app.post('/api/predictions/:id/follow', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const followed = await prisma.followedPrediction.create({
      data: { userId, predictionId: id }
    });
    res.json(followed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to follow prediction' });
  }
});

app.delete('/api/predictions/:id/follow', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await prisma.followedPrediction.delete({
      where: { userId_predictionId: { userId, predictionId: id } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unfollow prediction' });
  }
});

app.post('/api/bets', async (req, res) => {
  const { predictionId, portfolioId, stake, odds, betType } = req.body;
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.bet.findFirst({
      where: { predictionId, portfolioId }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bet already placed for this prediction' });
    }

    const bet = await prisma.bet.create({
      data: {
        predictionId,
        portfolioId,
        stake: parseFloat(stake),
        odds: parseFloat(odds),
        betType,
        status: 'PENDING'
      }
    });
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

app.get('/api/portfolios', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        bets: {
          include: {
            prediction: {
              include: {
                fixture: {
                  include: {
                    homeTeam: true,
                    awayTeam: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (portfolios.length === 0) {
      const defaultPortfolio = await prisma.portfolio.create({
        data: {
          name: 'Main Portfolio',
          userId,
          riskValue: 0.25,
          bankroll: 10000,
          initialBankroll: 10000
        },
        include: {
          bets: {
            include: {
              prediction: true
            }
          }
        }
      });
      portfolios = [defaultPortfolio];
    }

    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

app.get('/api/performance', async (req, res) => {
  try {
    const settlementService = new SettlementService();
    await settlementService.settleAll();

    const allEvaluated = await prisma.prediction.findMany({
      where: { isCorrect: { not: null } },
      orderBy: { createdAt: 'desc' }
    });

    const wins = allEvaluated.filter(p => p.isCorrect).length;
    const total = allEvaluated.length;
    const winRate = total > 0 ? wins / total : 0;
    const roi = total > 0 ? (wins * 1.95 - total) / total : 0;

    res.json({
      winRate,
      roi,
      totalPredictions: total,
      wins,
      losses: total - wins,
      history: allEvaluated.slice(0, 20)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

app.get('/api/research/models', apiKeyMiddleware, async (req, res) => {
  try {
    const models = await prisma.modelArtifact.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

app.post('/api/research/models/:id/approve', apiKeyMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const model = await prisma.modelArtifact.update({
      where: { id },
      data: { status: 'PRODUCTION' }
    });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve model' });
  }
});

app.get('/api/research/metrics', apiKeyMiddleware, async (req, res) => {
  const { modelName } = req.query;
  try {
    const metrics = await prisma.driftMetric.findMany({
      where: modelName ? { modelName: String(modelName) } : {},
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.get('/api/predictions', apiKeyMiddleware, async (req, res) => {
  try {
    const cached = await cacheService.get('all_predictions');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const predictions = await prisma.prediction.findMany({
      include: {
        fixture: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    await cacheService.set('all_predictions', JSON.stringify(predictions), 300); // 5 min cache
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/admin/sync', apiKeyMiddleware, async (req, res) => {
  try {
    const provider = ProviderFactory.getProvider(process.env.FOOTBALL_PROVIDER || 'mock');
    const ingestionService = new IngestionService(provider);
    await ingestionService.syncLeagues();
    await ingestionService.syncTeams(1, 2024);
    await ingestionService.syncFixtures(1, 2024);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('Client connected to real-time stream');
  
  socket.on('subscribe:fixture', (fixtureId) => {
    socket.join(`fixture:${fixtureId}`);
    console.log(`Client subscribed to fixture:${fixtureId}`);
  });
});

const broadcastService = new LiveBroadcastService(process.env.REDIS_URL || 'redis://redis:6379', io);
broadcastService.connect().then(() => {
  broadcastService.run();
});

const settlementService = new SettlementService();
setInterval(() => {
  settlementService.settleAll();
}, 30 * 60 * 1000);
