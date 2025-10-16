import { Test, TestingModule } from '@nestjs/testing';
import { ResponseController } from './response.controller';
import { ResponseService } from '../services/response.service';
import type { MarketplaceResponseWithData } from '../persistence/dao/interfaces/response.dao.interface';

describe('ResponseController', () => {
  let controller: ResponseController;

  const mockResponseService = {
    getAllResponses: jest.fn(),
    getResponseStats: jest.fn(),
    getLatestResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponseController],
      providers: [
        {
          provide: ResponseService,
          useValue: mockResponseService,
        },
      ],
    }).compile();

    controller = module.get<ResponseController>(ResponseController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllResponses', () => {
    it('should return paginated responses with default values', async () => {
      const mockResponses = [
        { marketplaceData: { activeDeals: 1 } },
        { marketplaceData: { activeDeals: 2 } },
      ] as unknown as MarketplaceResponseWithData[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses();

      expect(result).toEqual({
        success: true,
        data: [{ activeDeals: 1 }, { activeDeals: 2 }],
        pagination: {
          limit: 100,
          offset: 0,
          count: 2,
        },
      });
      expect(mockResponseService.getAllResponses).toHaveBeenCalledWith(100, 0);
    });

    it('should return paginated responses with custom values', async () => {
      const mockResponses = [
        { marketplaceData: { averageDealValueUSD: 10000 } },
      ] as unknown as MarketplaceResponseWithData[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses('50', '10');

      expect(result).toEqual({
        success: true,
        data: [{ averageDealValueUSD: 10000 }],
        pagination: {
          limit: 50,
          offset: 10,
          count: 1,
        },
      });
      expect(mockResponseService.getAllResponses).toHaveBeenCalledWith(50, 10);
    });

    it('should handle invalid query parameters', async () => {
      const mockResponses = [] as unknown as MarketplaceResponseWithData[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses('invalid', 'invalid');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('getResponseStats', () => {
    it('should return response statistics', async () => {
      const mockStats = {
        total: 100,
        successful: 80,
        failed: 20,
        successRate: 80,
        averageResponseTime: 150.5,
      };

      mockResponseService.getResponseStats.mockResolvedValue(mockStats);

      const result = await controller.getResponseStats();

      expect(result).toEqual({
        success: true,
        data: mockStats,
      });
      expect(mockResponseService.getResponseStats).toHaveBeenCalled();
    });
  });

  describe('getLatestResponse', () => {
    it('should return latest response marketplaceData', async () => {
      const mockResponse = {
        marketplaceData: { offersSubmitted: 5 },
      } as { marketplaceData: { offersSubmitted: number } };

      mockResponseService.getLatestResponse.mockResolvedValue(mockResponse);

      const result = await controller.getLatestResponse();

      expect(result).toEqual({
        success: true,
        data: { offersSubmitted: 5 },
      });
      expect(mockResponseService.getLatestResponse).toHaveBeenCalled();
    });

    it('should handle null latest response', async () => {
      mockResponseService.getLatestResponse.mockResolvedValue(null);

      const result = await controller.getLatestResponse();

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });
  });
});
