import { Test, TestingModule } from '@nestjs/testing';
import { ResponseController } from './response.controller';
import { ResponseService } from './response.service';
import { ResponseDocument } from './schemas/response.schema';

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
        { _id: '1', statusCode: 200, timestamp: new Date() },
        { _id: '2', statusCode: 200, timestamp: new Date() },
      ] as ResponseDocument[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses();

      expect(result).toEqual({
        success: true,
        data: mockResponses,
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
        { _id: '1', statusCode: 200, timestamp: new Date() },
      ] as ResponseDocument[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses('50', '10');

      expect(result).toEqual({
        success: true,
        data: mockResponses,
        pagination: {
          limit: 50,
          offset: 10,
          count: 1,
        },
      });
      expect(mockResponseService.getAllResponses).toHaveBeenCalledWith(50, 10);
    });

    it('should handle invalid query parameters', async () => {
      const mockResponses = [] as ResponseDocument[];

      mockResponseService.getAllResponses.mockResolvedValue(mockResponses);

      const result = await controller.getAllResponses('invalid', 'invalid');

      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.offset).toBe(0);
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
    it('should return latest response', async () => {
      const mockResponse = {
        _id: '123',
        statusCode: 200,
        timestamp: new Date(),
      } as ResponseDocument;

      mockResponseService.getLatestResponse.mockResolvedValue(mockResponse);

      const result = await controller.getLatestResponse();

      expect(result).toEqual({
        success: true,
        data: mockResponse,
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
