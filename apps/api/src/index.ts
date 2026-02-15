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
