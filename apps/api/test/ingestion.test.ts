import { IngestionService } from '../src/services/ingestion/ingestion.service';
import { MockProvider } from '@football/ingestion';
import prisma from '@football/database';

jest.mock('@football/database', () => ({
  __esModule: true,
  default: {
    providerMapping: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    league: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Ingestion Service', () => {
  let service: IngestionService;
  let provider: MockProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MockProvider();
    service = new IngestionService(provider);
  });

  it('should create a new league and mapping when none exists', async () => {
    (prisma.providerMapping.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.league.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.league.create as jest.Mock).mockResolvedValue({ id: 'internal-uuid-1' });

    await service.syncLeagues();

    expect(prisma.league.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Mock League 1',
      }),
    });
    expect(prisma.providerMapping.create).toHaveBeenCalledWith({
      data: {
        internalId: 'internal-uuid-1',
        externalId: '1',
        providerName: 'MockProvider',
        entityType: 'LEAGUE',
      },
    });
  });

  it('should reuse internalId if mapping already exists', async () => {
    (prisma.providerMapping.findUnique as jest.Mock).mockResolvedValue({ internalId: 'existing-id' });

    await service.syncLeagues();

    expect(prisma.league.create).not.toHaveBeenCalled();
    expect(prisma.providerMapping.create).not.toHaveBeenCalled();
  });
});
