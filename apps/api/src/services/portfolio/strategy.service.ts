import prisma from '@football/database';

export class StrategyService {
  async createStrategy(data: { name: string; type: string; description?: string }) {
    return (prisma as any).strategy.create({
      data: {
        ...data,
        status: 'ACTIVE'
      }
    });
  }

  async getStrategies() {
    return (prisma as any).strategy.findMany({
      include: {
        allocations: true
      }
    });
  }

  async updateStrategyStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'RETIRED') {
    return (prisma as any).strategy.update({
      where: { id },
      data: { status }
    });
  }

  async allocateToPortfolio(strategyId: string, portfolioId: string, weight: number) {
    return (prisma as any).strategyAllocation.create({
      data: {
        strategyId,
        portfolioId,
        weight,
        isActive: true
      }
    });
  }

  async updateAllocation(allocationId: string, weight: number, isActive: boolean) {
    return (prisma as any).strategyAllocation.update({
      where: { id: allocationId },
      data: { weight, isActive }
    });
  }
}
