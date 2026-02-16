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

    for (const prediction of fixture.predictions) {
      // 1. Settle Prediction Accuracy
      if (prediction.isCorrect === null) {
        let isCorrect = null;
        if (isFinished) {
          isCorrect = this.checkOutcome(prediction.marketType, prediction.selection, fixture);
        }

        if (isCorrect !== null) {
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: { isCorrect }
          });
          console.log(`[Settlement:${runId}] Prediction ${prediction.id} (${prediction.marketType}:${prediction.selection}) settled as ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        }
      }

      // 2. Settle Bets
      for (const bet of prediction.bets) {
        if (bet.status !== 'PENDING') continue;

        let status: 'WON' | 'LOST' | 'VOID' | 'PENDING' = 'PENDING';
        let profit = 0;

        if (isFinished) {
          const betIsCorrect = this.checkOutcome(prediction.marketType, prediction.selection, fixture);
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

  private checkOutcome(marketType: string, selection: string, fixture: any): boolean {
    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;

    switch (marketType) {
      case '1X2':
        const actual1X2 = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';
        return selection === actual1X2;

      case 'OVER_UNDER_2_5':
        const totalGoals = homeScore + awayScore;
        if (selection === 'OVER') return totalGoals > 2.5;
        if (selection === 'UNDER') return totalGoals < 2.5;
        return false;

      case 'BTTS':
        const btts = homeScore > 0 && awayScore > 0;
        if (selection === 'YES') return btts;
        if (selection === 'NO') return !btts;
        return false;

      case 'HOME_OVER_UNDER_1_5':
        if (selection === 'OVER') return homeScore > 1.5;
        if (selection === 'UNDER') return homeScore < 1.5;
        return false;

      case 'AWAY_OVER_UNDER_1_5':
        if (selection === 'OVER') return awayScore > 1.5;
        if (selection === 'UNDER') return awayScore < 1.5;
        return false;

      default:
        // Handle old logic if marketType is missing (though it shouldn't be with new data)
        if (!marketType && selection) {
          const actual1X2 = homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';
          return selection.toUpperCase() === actual1X2;
        }
        return false;
    }
  }
}
