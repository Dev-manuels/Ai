import express from 'express';
import cors from 'cors';
import prisma from '@football/database';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/predictions', async (req, res) => {
  try {
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
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
