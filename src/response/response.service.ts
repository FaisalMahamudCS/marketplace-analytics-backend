import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MarketplaceResponseDAO } from './dao/response.dao';
import {
  ResponseStats,
  MarketplaceData,
} from './dao/interfaces/response.dao.interface';

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);

  constructor(
    private readonly marketplaceResponseDAO: MarketplaceResponseDAO,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate marketplace-specific payload
   */
  private generateMarketplacePayload(): MarketplaceData {
    return {
      timestamp: Date.now(),
      activeDeals: Math.floor(Math.random() * 200) + 50, // 50–250
      newDeals: Math.floor(Math.random() * 10), // 0–9
      averageDealValueUSD: Math.floor(Math.random() * 50000) + 5000, // $5k–$55k
      offersSubmitted: Math.floor(Math.random() * 30), // 0–29
      userViews: Math.floor(Math.random() * 500), // 0–499
    };
  }

  /**
   * Ping httpbin.org/anything endpoint with marketplace payload
   */
  async pingHttpBin(): Promise<void> {
    const startTime = Date.now();
    const marketplaceData = this.generateMarketplacePayload();

    try {
      this.logger.log('Pinging httpbin.org/anything with marketplace data...');

      const response = await firstValueFrom(
        this.httpService.post('https://httpbin.org/anything', marketplaceData, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Marketplace-Analytics-Backend/1.0',
          },
          timeout: 10000, // 10 second timeout
        }),
      );

      const responseTime = Date.now() - startTime;

      const marketplaceResponseData = {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        marketplaceData: marketplaceData,
        statusCode: response.status,
        responseData: {
          success: true,
          httpbinResponse: response.data as Record<string, unknown>,
        },
        responseTime,
        timestamp: new Date(),
      };

      await this.marketplaceResponseDAO.create(marketplaceResponseData);
      this.logger.log(
        `Successfully pinged httpbin.org - Status: ${response.status}, Response Time: ${responseTime}ms`,
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const errorData = {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        marketplaceData: marketplaceData,
        statusCode:
          (error as { response?: { status?: number } }).response?.status || 0,
        responseData:
          (error as { response?: { data?: unknown } }).response?.data || null,
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };

      await this.marketplaceResponseDAO.create(errorData);
      this.logger.error(
        `Failed to ping httpbin.org: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get all historical marketplace response data
   */
  async getAllResponses(limit: number = 100, offset: number = 0) {
    return await this.marketplaceResponseDAO.findAll(limit, offset);
  }

  /**
   * Get marketplace response statistics
   */
  async getResponseStats(): Promise<ResponseStats> {
    return await this.marketplaceResponseDAO.getStats();
  }

  /**
   * Get latest marketplace response for real-time updates
   */
  async getLatestResponse() {
    return await this.marketplaceResponseDAO.findLatest();
  }
}
