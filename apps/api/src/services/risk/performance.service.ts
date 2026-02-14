import prisma from '@football/database';

export class PerformanceService {
  /**
   * Calculates advanced risk-adjusted performance metrics.
   */
  async getPortfolioAnalytics(portfolioId: string) {
    const bets = await prisma.bet.findMany({
      where: { portfolioId, status: { in: ['WON', 'LOST'] } },
      orderBy: { createdAt: 'asc' }
    });

    if (bets.length === 0) return this.getDefaultMetrics();

    const returns = bets.map(b => b.profit || 0);
    const totalProfit = returns.reduce((a, b) => a + b, 0);
    const avgReturn = totalProfit / returns.length;

    // 1. Sharpe Ratio (Simplified - assuming 0% risk-free rate for now)
    const stdDev = this.calculateStandardDeviation(returns);
    const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(365); // Annualized

    // 2. Sortino Ratio (Only penalizes downside volatility)
    const downsideDev = this.calculateDownsideDeviation(returns);
    const sortinoRatio = downsideDev === 0 ? 0 : (avgReturn / downsideDev) * Math.sqrt(365);

    // 3. Profit Factor (Gross Gains / Gross Losses)
    const grossGains = returns.filter(r => r > 0).reduce((a, b) => a + b, 0);
    const grossLosses = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0));
    const profitFactor = grossLosses === 0 ? grossGains : grossGains / grossLosses;

    return {
      roi: (totalProfit / bets.length), // Assuming unit stakes for simplicity in this example
      sharpeRatio,
      sortinoRatio,
      profitFactor,
      totalBets: bets.length,
      winRate: bets.filter(b => b.status === 'WON').length / bets.length
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateDownsideDeviation(values: number[]): number {
    const downsides = values.filter(v => v < 0);
    if (downsides.length === 0) return 0;
    const squareDiffs = downsides.map(v => Math.pow(v, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private getDefaultMetrics() {
    return {
      roi: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      profitFactor: 0,
      totalBets: 0,
      winRate: 0
    };
  }
}
