import express from 'express';
import cors from 'cors';
import prisma from '@football/database';
import { CacheService } from './services/cache/cache.service';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import rateLimit from 'express-rate-limit';
import { apiKeyMiddleware } from './middleware/api-key.middleware';
import { Server } from 'socket.io';
import { createServer } from 'http';

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
  
  socket.on('subscribe:odds', (fixtureId) => {
    socket.join(`odds:${fixtureId}`);
  });
});

// For broadcasting updates
export const broadcastOddsUpdate = (fixtureId: string, odds: any) => {
  io.to(`odds:${fixtureId}`).emit('odds:update', odds);
};
