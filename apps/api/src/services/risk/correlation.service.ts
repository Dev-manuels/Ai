import prisma from '@football/database';

export class CorrelationService {
  /**
   * Detects potential correlation risks between a new prediction and active bets.
   */
  async checkCorrelationRisk(portfolioId: string, newFixtureId: string) {
    const activeBets = await prisma.bet.findMany({
      where: { portfolioId, status: 'PENDING' },
      include: {
        prediction: {
          include: {
            fixture: true
          }
        }
      }
    });

    const newFixture = await prisma.fixture.findUnique({
      where: { id: newFixtureId }
    });

    if (!newFixture) return { riskScore: 0, clusters: [] };

    let riskScore = 0;
    const clusters = [];

    // 1. League-level clustering check
    const sameLeagueBets = activeBets.filter(b => b.prediction.fixture.leagueId === newFixture.leagueId);
    if (sameLeagueBets.length >= 3) {
      riskScore += 0.5;
      clusters.push(`High concentration in ${newFixture.leagueId}`);
    }

    // 2. Temporal clustering (multiple bets in the same day)
    const sameDayBets = activeBets.filter(b => 
      new Date(b.prediction.fixture.date).toDateString() === new Date(newFixture.date).toDateString()
    );
    if (sameDayBets.length >= 5) {
      riskScore += 0.3;
      clusters.push('High daily exposure clustering');
    }

    return {
      riskScore,
      clusters,
      isHighRisk: riskScore >= 0.8
    };
  }
}
