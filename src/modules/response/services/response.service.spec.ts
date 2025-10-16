/*
eslint-disable @typescript-eslint/no-unsafe-assignment,
               @typescript-eslint/no-unsafe-member-access
*/
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseService } from './response.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { MARKETPLACE_RESPONSE_REPOSITORY } from '../repositories/../repositories/tokens';

describe('ResponseService', () => {
  let service: ResponseService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findLatest: jest.fn(),
    getStats: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseService,
        { provide: MARKETPLACE_RESPONSE_REPOSITORY, useValue: mockRepository },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ResponseService>(ResponseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMarketplacePayload', () => {
    it('should generate payload with valid ranges', () => {
      const payload = (
        service as unknown as { generateMarketplacePayload: () => any }
      ).generateMarketplacePayload();
      expect(typeof payload.timestamp).toBe('number');
      expect(payload.activeDeals).toBeGreaterThanOrEqual(50);
      expect(payload.activeDeals).toBeLessThanOrEqual(250);
      expect(payload.newDeals).toBeGreaterThanOrEqual(0);
      expect(payload.newDeals).toBeLessThanOrEqual(9);
      expect(payload.averageDealValueUSD).toBeGreaterThanOrEqual(5000);
      expect(payload.averageDealValueUSD).toBeLessThanOrEqual(55000);
      expect(payload.offersSubmitted).toBeGreaterThanOrEqual(0);
      expect(payload.offersSubmitted).toBeLessThanOrEqual(29);
      expect(payload.userViews).toBeGreaterThanOrEqual(0);
      expect(payload.userViews).toBeLessThanOrEqual(499);
    });
  });

  describe('pingHttpBin', () => {
    it('should POST to httpbin and persist marketplace response', async () => {
      const mockResponse = { status: 200, data: { ok: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockRepository.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://httpbin.org/anything',
        expect.objectContaining({
          timestamp: expect.any(Number),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'Marketplace-Analytics-Backend/1.0',
          }),
          timeout: 10000,
        }),
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://httpbin.org/anything',
          method: 'POST',
          statusCode: 200,
          responseTime: expect.any(Number),
          timestamp: expect.any(Date),
        }),
      );
    });

    it('should persist error shape on HTTP error with response', async () => {
      const httpError = {
        response: { status: 500, data: { error: 'Internal' } },
        message: 'Request failed',
      };
      mockHttpService.post.mockReturnValue(throwError(() => httpError));
      mockRepository.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          responseData: { error: 'Internal' },
          error: 'Request failed',
        }),
      );
    });

    it('should persist error shape on network error (no response)', async () => {
      const httpError = { message: 'Network Error' };
      mockHttpService.post.mockReturnValue(throwError(() => httpError));
      mockRepository.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 0,
          responseData: null,
          error: 'Network Error',
        }),
      );
    });
  });

  describe('getAllResponses', () => {
    it('should return results and use defaults', async () => {
      mockRepository.findAll.mockResolvedValue([] as any);
      await service.getAllResponses();
      expect(mockRepository.findAll).toHaveBeenCalledWith(100, 0);
    });

    it('should forward pagination params', async () => {
      mockRepository.findAll.mockResolvedValue([{}] as any);
      const res = await service.getAllResponses(10, 5);
      expect(res).toEqual([{}]);
      expect(mockRepository.findAll).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('getResponseStats', () => {
    it('should return repository stats', async () => {
      const stats = {
        total: 1,
        successful: 1,
        failed: 0,
        successRate: 100,
        averageResponseTime: 10,
      };
      mockRepository.getStats.mockResolvedValue(stats);
      const res = await service.getResponseStats();
      expect(res).toEqual(stats);
    });
  });

  describe('getLatestResponse', () => {
    it('should return latest from repository', async () => {
      mockRepository.findLatest.mockResolvedValue({ _id: 'x' } as any);
      const res = await service.getLatestResponse();
      expect(res).toEqual({ _id: 'x' });
    });

    it('should return null if none', async () => {
      mockRepository.findLatest.mockResolvedValue(null);
      const res = await service.getLatestResponse();
      expect(res).toBeNull();
    });
  });
});
