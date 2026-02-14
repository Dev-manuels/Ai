import prisma from '@football/database';

export class MasterBankrollService {
  async getMasterBankroll() {
    let mb = await (prisma as any).masterBankroll.findFirst();
    if (!mb) {
      mb = await (prisma as any).masterBankroll.create({
        data: {
          totalCapital: 1000000, // 1M default
          availableCapital: 1000000
        }
      });
    }
    return mb;
  }

  async updateCapital(totalCapital: number) {
    const mb = await this.getMasterBankroll();
    return (prisma as any).masterBankroll.update({
      where: { id: mb.id },
      data: { totalCapital }
    });
  }

  async suggestRebalancing() {
    // Conceptual advisory layer
    const portfolios = await (prisma as any).portfolio.findMany({
      include: { allocations: { include: { strategy: true } } }
    });

    // Logic to suggest moving capital from underperforming to overperforming portfolios/strategies
    // This would ideally consume data from the ML service
    return portfolios.map((p: any) => ({
      portfolioId: p.id,
      name: p.name,
      currentBankroll: p.bankroll,
      suggestedBankroll: p.bankroll * 1.05, // Placeholder logic
      reason: 'Strategy momentum detected'
    }));
  }
}
