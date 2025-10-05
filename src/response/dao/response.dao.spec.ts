import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MarketplaceResponseDAO } from './response.dao';
import { MarketplaceResponse } from '../schemas/response.schema';

describe('MarketplaceResponseDAO', () => {
  let dao: MarketplaceResponseDAO;

  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const injectedModelMock: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
  } = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue(mockQuery),
    findOne: jest.fn().mockReturnValue(mockQuery),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceResponseDAO,
        {
          provide: getModelToken(MarketplaceResponse.name),
          useValue: injectedModelMock,
        },
      ],
    }).compile();

    dao = module.get<MarketplaceResponseDAO>(MarketplaceResponseDAO);
    // make sure the dao uses our mock reference
    (
      dao as unknown as { marketplaceResponseModel: typeof injectedModelMock }
    ).marketplaceResponseModel = injectedModelMock;
    jest.clearAllMocks();
  });

  it('create: should save document', async () => {
    const data = { url: 'u', method: 'POST' } as Record<string, unknown>;
    injectedModelMock.create.mockResolvedValue({ _id: '1', ...data });
    const res = await dao.create(data);
    expect(res).toEqual({ _id: '1', ...data });
    expect(injectedModelMock.create).toHaveBeenCalledWith(data);
  });

  it('findAll: should paginate and sort', async () => {
    mockQuery.exec.mockResolvedValue([{ _id: 'a' }]);
    injectedModelMock.find.mockReturnValue(mockQuery);
    const res = await dao.findAll(10, 5);
    expect(res).toEqual([{ _id: 'a' }]);
    expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(mockQuery.limit).toHaveBeenCalledWith(10);
    expect(mockQuery.skip).toHaveBeenCalledWith(5);
  });

  it('findLatest: should return last by timestamp', async () => {
    mockQuery.exec.mockResolvedValue({ _id: 'z' });
    injectedModelMock.findOne.mockReturnValue(mockQuery);
    const res = await dao.findLatest();
    expect(res).toEqual({ _id: 'z' });
    expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
  });

  it('getStats: should compute aggregate stats', async () => {
    injectedModelMock.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(20);
    injectedModelMock.aggregate.mockResolvedValue([{ avgTime: 150 }]);
    const stats = await dao.getStats();
    expect(stats).toEqual({
      total: 100,
      successful: 80,
      failed: 20,
      successRate: 80,
      averageResponseTime: 150,
    });
  });
});
