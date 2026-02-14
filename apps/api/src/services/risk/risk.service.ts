import prisma from '@football/database';

export class RiskService {
  /**
   * Checks if a portfolio is currently eligible to place bets.
   * Enforces circuit breakers and exposure limits.
   */
  async checkBetEligibility(portfolioId: string, suggestedStake: number) {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        bets: {
          where: { status: 'PENDING' }
        }
      }
    });

    if (!portfolio || !portfolio.isActive) {
      return { eligible: false, reason: 'Portfolio is inactive' };
    }

    // 1. Circuit Breaker Check (Drawdown)
    const currentDrawdown = this.calculateCurrentDrawdown(portfolio);
    if (currentDrawdown >= portfolio.circuitBreakerThreshold) {
      // Automatically pause portfolio
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { isActive: false }
      });
      return { eligible: false, reason: 'Circuit breaker triggered: Max drawdown exceeded' };
    }

    // 2. Exposure Limit Check (Default 5% max concurrent exposure)
    const activeExposure = portfolio.bets.reduce((acc, bet) => acc + bet.stake, 0);
    const totalExposureWithNewBet = activeExposure + (portfolio.bankroll * suggestedStake);

    if (totalExposureWithNewBet > (portfolio.bankroll * 0.05)) {
      return { eligible: false, reason: 'Exposure limit exceeded: Max 5% concurrent exposure' };
    }

    return { eligible: true };
  }

  private calculateCurrentDrawdown(portfolio: any): number {
    if (!portfolio.initialBankroll) return 0;
    const currentDrawdown = (portfolio.initialBankroll - portfolio.bankroll) / portfolio.initialBankroll;
    return Math.max(0, currentDrawdown);
  }

  /**
   * Evaluates if a portfolio should be reactivated after a circuit breaker trip.
   */
  async evaluateRecovery(portfolioId: string) {
    // Professional systems require manual audit or specific recovery conditions
    return { canRecover: false, reason: 'Manual audit required after circuit breaker trip' };
  }
}
