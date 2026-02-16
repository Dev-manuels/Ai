import prisma from '@football/database';

export class SettlementService {
  async settleAll() {
    const runId = Math.random().toString(36).substring(7);
    console.log(`[Settlement:${runId}] Starting automated settlement process...`);

    try {
      const fixturesToSettle = await prisma.fixture.findMany({
        where: {
          status: { in: ['FT', 'CANC', 'POSTP', 'ABD'] },
          OR: [
            { predictions: { some: { isCorrect: null } } },
            { predictions: { some: { bets: { some: { status: 'PENDING' } } } } }
          ]
        },
        include: {
          predictions: {
            include: {
              bets: true
            }
          },
          homeTeam: true,
          awayTeam: true
        }
      });

      console.log(`[Settlement:${runId}] Found ${fixturesToSettle.length} fixtures requiring attention`);

      for (const fixture of fixturesToSettle) {
        await this.settleFixture(fixture, runId);
      }

      console.log(`[Settlement:${runId}] Settlement run completed successfully`);
    } catch (error) {
      console.error(`[Settlement:${runId}] CRITICAL ERROR:`, error);
    }
  }

  private async settleFixture(fixture: any, runId: string) {
    const isFinished = fixture.status === 'FT';
    const isVoid = ['CANC', 'POSTP', 'ABD'].includes(fixture.status);

    console.log(`[Settlement:${runId}] Processing Fixture ${fixture.id} (${fixture.homeTeam.name} vs ${fixture.awayTeam.name}) - Status: ${fixture.status}`);

    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;
    const actualOutcome = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';

    for (const prediction of fixture.predictions) {
      // 1. Settle Prediction Accuracy
      if (prediction.isCorrect === null) {
        let isCorrect = null;
        if (isFinished) {
          isCorrect = this.checkOutcome(prediction.recommendedBet, actualOutcome, fixture);
        }

        if (isCorrect !== null) {
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: { isCorrect }
          });
          console.log(`[Settlement:${runId}] Prediction ${prediction.id} settled as ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        }
      }

      // 2. Settle Bets
      for (const bet of prediction.bets) {
        if (bet.status !== 'PENDING') continue;

        let status: 'WON' | 'LOST' | 'VOID' | 'PENDING' = 'PENDING';
        let profit = 0;

        if (isFinished) {
          const betIsCorrect = this.checkOutcome(bet.betType, actualOutcome, fixture);
          status = betIsCorrect ? 'WON' : 'LOST';
          profit = betIsCorrect ? (bet.stake * bet.odds) - bet.stake : -bet.stake;
        } else if (isVoid) {
          status = 'VOID';
          profit = 0; // Stake returned
        }

        if (status !== 'PENDING') {
          await prisma.$transaction([
            prisma.bet.update({
              where: { id: bet.id },
              data: {
                status,
                profit,
                settledAt: new Date()
              }
            }),
            prisma.portfolio.update({
              where: { id: bet.portfolioId },
              data: {
                bankroll: { increment: profit }
              }
            })
          ]);
          console.log(`[Settlement:${runId}] Bet ${bet.id} settled as ${status} | Profit: ${profit}`);
        }
      }
    }
  }

  private checkOutcome(betType: string, actualOutcome: string, fixture: any): boolean {
    const bet = betType.toLowerCase();
    if (actualOutcome === 'HOME' && (bet.includes('home') || bet.includes(fixture.homeTeam.name.toLowerCase()))) return true;
    if (actualOutcome === 'AWAY' && (bet.includes('away') || bet.includes(fixture.awayTeam.name.toLowerCase()))) return true;
    if (actualOutcome === 'DRAW' && bet.includes('draw')) return true;
    return false;
  }
}
