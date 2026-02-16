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

app.get('/api/performance', async (req, res) => {
  try {
    const finishedFixtures = await prisma.fixture.findMany({
      where: {
        status: 'FT',
        predictions: {
          some: { isCorrect: null }
        }
      },
      include: {
        predictions: true,
        homeTeam: true,
        awayTeam: true
      }
    });

    for (const fixture of finishedFixtures) {
      for (const prediction of fixture.predictions) {
        if (prediction.isCorrect !== null) continue;

        const homeScore = fixture.homeScore ?? 0;
        const awayScore = fixture.awayScore ?? 0;
        const actualOutcome = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';

        const bet = prediction.recommendedBet.toLowerCase();
        let isCorrect = false;
        if (actualOutcome === 'HOME' && (bet.includes('home') || bet.includes(fixture.homeTeam.name.toLowerCase()))) isCorrect = true;
        else if (actualOutcome === 'AWAY' && (bet.includes('away') || bet.includes(fixture.awayTeam.name.toLowerCase()))) isCorrect = true;
        else if (actualOutcome === 'DRAW' && bet.includes('draw')) isCorrect = true;

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect }
        });
      }
    }

    const allEvaluated = await prisma.prediction.findMany({
      where: { isCorrect: { not: null } },
      orderBy: { createdAt: 'desc' }
    });

    const wins = allEvaluated.filter(p => p.isCorrect).length;
    const total = allEvaluated.length;
    const winRate = total > 0 ? wins / total : 0;
    const roi = total > 0 ? (wins * 1.95 - total) / total : 0; // Assuming 1.95 avg odds

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
