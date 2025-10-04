import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  Response,
  ResponseDocument,
  MarketplaceResponse,
  MarketplaceResponseDocument,
  MarketplaceData,
} from './schemas/response.schema';
import { firstValueFrom } from 'rxjs';

export interface ResponseStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageResponseTime: number;
}

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);

  constructor(
    @InjectModel(Response.name) private responseModel: Model<ResponseDocument>,
    @InjectModel(MarketplaceResponse.name)
    private marketplaceResponseModel: Model<MarketplaceResponseDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

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
   * Generate marketplace payload
   */
  private generateRandomPayload(): Record<string, unknown> {
    return this.generateMarketplacePayload();
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

      await this.saveMarketplaceResponse(marketplaceResponseData);
      this.logger.log(
        `Successfully pinged httpbin.org - Status: ${response.status}, Response Time: ${responseTime}ms`,
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const errorData = {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        marketplaceData: marketplaceData,
        statusCode: (error as any).response?.status || 0,
        responseData: (error as any).response?.data || null,
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };

      await this.saveMarketplaceResponse(errorData);
      this.logger.error(
        `Failed to ping httpbin.org: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Save response data to database
   */
  private async saveResponse(
    responseData: Record<string, unknown>,
  ): Promise<ResponseDocument> {
    const response = new this.responseModel(responseData);
    return await response.save();
  }

  /**
   * Save marketplace response data to database
   */
  private async saveMarketplaceResponse(
    responseData: Record<string, unknown>,
  ): Promise<MarketplaceResponseDocument> {
    const response = new this.marketplaceResponseModel(responseData);
    return await response.save();
  }

  /**
   * Get all historical marketplace response data
   */
  async getAllResponses(
    limit: number = 100,
    offset: number = 0,
  ): Promise<MarketplaceResponseDocument[]> {
    return await this.marketplaceResponseModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get marketplace response statistics
   */
  async getResponseStats(): Promise<ResponseStats> {
    const total = await this.marketplaceResponseModel.countDocuments();
    const successful = await this.marketplaceResponseModel.countDocuments({
      statusCode: { $gte: 200, $lt: 400 },
    });
    const failed = await this.marketplaceResponseModel.countDocuments({
      statusCode: { $gte: 400 },
    });

    const avgResponseTime = await this.marketplaceResponseModel.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageResponseTime: (avgResponseTime[0] as any)?.avgTime || 0,
    };
  }

  /**
   * Get latest marketplace response for real-time updates
   */
  async getLatestResponse(): Promise<MarketplaceResponseDocument | null> {
    return await this.marketplaceResponseModel
      .findOne()
      .sort({ timestamp: -1 })
      .exec();
  }
}
