import prisma from '@football/database';

export interface PortfolioCreateInput {
  name: string;
  userId: string;
  strategy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  riskValue: number;
  initialBankroll: number;
}

export class PortfolioService {
  async createPortfolio(input: PortfolioCreateInput) {
    return prisma.portfolio.create({
      data: {
        ...input,
        bankroll: input.initialBankroll,
      },
    });
  }

  async getPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        bets: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Calculates suggested capital allocation across leagues.
   * Based on stability and historical performance.
   */
  async getSuggestedAllocation(portfolioId: string) {
    // This is an advisory layer for institutional-grade management
    // In a real system, we'd query historical ROI per league for this portfolio/strategy
    return [
      { league: 'Premier League', allocation: 0.4, confidence: 'HIGH' },
      { league: 'La Liga', allocation: 0.3, confidence: 'MEDIUM' },
      { league: 'Bundesliga', allocation: 0.2, confidence: 'MEDIUM' },
      { league: 'Serie A', allocation: 0.1, confidence: 'LOW' },
    ];
  }

  async updateBankroll(portfolioId: string, amount: number) {
    return prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        bankroll: {
          increment: amount
        }
      }
    });
  }
}
