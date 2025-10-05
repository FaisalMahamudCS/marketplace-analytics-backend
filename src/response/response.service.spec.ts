/*
eslint-disable @typescript-eslint/no-unsafe-assignment,
               @typescript-eslint/no-unsafe-member-access,
               @typescript-eslint/no-unsafe-argument,
               @typescript-eslint/unbound-method
*/
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseService } from './response.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MarketplaceResponseDAO } from './dao/response.dao';
import { of, throwError } from 'rxjs';
import { ResponseStats } from './dao/interfaces/response.dao.interface';

describe('ResponseService', () => {
  let service: ResponseService;

  const mockMarketplaceResponseDAO: jest.Mocked<MarketplaceResponseDAO> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findLatest: jest.fn(),
    getStats: jest.fn(),
    countDocuments: jest.fn(),
    countSuccessful: jest.fn(),
    countFailed: jest.fn(),
    getAverageResponseTime: jest.fn(),
  } as any;

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
        {
          provide: MarketplaceResponseDAO,
          useValue: mockMarketplaceResponseDAO,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
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
      mockMarketplaceResponseDAO.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://httpbin.org/anything',
        expect.objectContaining({
          timestamp: expect.any(Number),
          activeDeals: expect.any(Number),
          newDeals: expect.any(Number),
          averageDealValueUSD: expect.any(Number),
          offersSubmitted: expect.any(Number),
          userViews: expect.any(Number),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'Marketplace-Analytics-Backend/1.0',
          }),
          timeout: 10000,
        }),
      );

      expect(mockMarketplaceResponseDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://httpbin.org/anything',
          method: 'POST',
          marketplaceData: expect.any(Object),
          statusCode: 200,
          responseData: expect.objectContaining({
            success: true,
            httpbinResponse: { ok: true },
          }),
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
      mockMarketplaceResponseDAO.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockMarketplaceResponseDAO.create).toHaveBeenCalledWith(
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
      mockMarketplaceResponseDAO.create.mockResolvedValue({} as any);

      await service.pingHttpBin();

      expect(mockMarketplaceResponseDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 0,
          responseData: null,
          error: 'Network Error',
        }),
      );
    });
  });

  describe('getAllResponses', () => {
    it('should return DAO results and use defaults', async () => {
      mockMarketplaceResponseDAO.findAll.mockResolvedValue([] as any);
      await service.getAllResponses();
      expect(mockMarketplaceResponseDAO.findAll).toHaveBeenCalledWith(100, 0);
    });

    it('should forward pagination params', async () => {
      mockMarketplaceResponseDAO.findAll.mockResolvedValue([{}] as any);
      const res = await service.getAllResponses(10, 5);
      expect(res).toEqual([{}]);
      expect(mockMarketplaceResponseDAO.findAll).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('getResponseStats', () => {
    it('should return DAO stats', async () => {
      const stats: ResponseStats = {
        total: 100,
        successful: 80,
        failed: 20,
        successRate: 80,
        averageResponseTime: 120,
      };
      mockMarketplaceResponseDAO.getStats.mockResolvedValue(stats);
      const res = await service.getResponseStats();
      expect(res).toEqual(stats);
    });
  });

  describe('getLatestResponse', () => {
    it('should return latest from DAO', async () => {
      mockMarketplaceResponseDAO.findLatest.mockResolvedValue({
        _id: 'x',
      } as any);
      const res = await service.getLatestResponse();
      expect(res).toEqual({ _id: 'x' });
    });

    it('should return null if none', async () => {
      mockMarketplaceResponseDAO.findLatest.mockResolvedValue(null);
      const res = await service.getLatestResponse();
      expect(res).toBeNull();
    });
  });
});
