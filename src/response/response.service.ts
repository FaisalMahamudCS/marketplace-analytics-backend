import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Response, ResponseDocument } from './schemas/response.schema';
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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Generate random JSON payload for testing
   */
  private generateRandomPayload(): Record<string, unknown> {
    const payloads = [
      { message: 'Hello World', timestamp: new Date().toISOString() },
      { data: { id: Math.floor(Math.random() * 1000), name: 'Test User' } },
      {
        request: {
          id: Math.random().toString(36).substring(7),
          type: 'monitoring',
          metadata: { source: 'analytics-backend' },
        },
      },
      {
        metrics: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          timestamp: Date.now(),
        },
      },
      {
        user: {
          id: Math.floor(Math.random() * 10000),
          email: `user${Math.floor(Math.random() * 1000)}@example.com`,
          active: Math.random() > 0.5,
        },
      },
    ];

    return payloads[Math.floor(Math.random() * payloads.length)];
  }

  /**
   * Ping httpbin.org/anything endpoint with random payload
   */
  async pingHttpBin(): Promise<void> {
    const startTime = Date.now();
    const payload = this.generateRandomPayload();

    try {
      this.logger.log('Pinging httpbin.org/anything...');

      const response = await firstValueFrom(
        this.httpService.post('https://httpbin.org/anything', payload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Marketplace-Analytics-Backend/1.0',
          },
          timeout: 10000, // 10 second timeout
        }),
      );

      const responseTime = Date.now() - startTime;

      const responseData = {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        requestPayload: payload,
        statusCode: response.status,
        responseData: response.data as Record<string, unknown>,
        responseTime,
        timestamp: new Date(),
      };

      await this.saveResponse(responseData);
      this.logger.log(
        `Successfully pinged httpbin.org - Status: ${response.status}, Response Time: ${responseTime}ms`,
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const errorData = {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        requestPayload: payload,
        statusCode: error.response?.status || 0,
        responseData: error.response?.data || null,
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };

      await this.saveResponse(errorData);
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
   * Get all historical response data
   */
  async getAllResponses(
    limit: number = 100,
    offset: number = 0,
  ): Promise<ResponseDocument[]> {
    return await this.responseModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get response statistics
   */
  async getResponseStats(): Promise<ResponseStats> {
    const total = await this.responseModel.countDocuments();
    const successful = await this.responseModel.countDocuments({
      statusCode: { $gte: 200, $lt: 400 },
    });
    const failed = await this.responseModel.countDocuments({
      statusCode: { $gte: 400 },
    });

    const avgResponseTime = await this.responseModel.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageResponseTime: avgResponseTime[0]?.avgTime || 0,
    };
  }

  /**
   * Get latest response for real-time updates
   */
  async getLatestResponse(): Promise<ResponseDocument | null> {
    return await this.responseModel.findOne().sort({ timestamp: -1 }).exec();
  }
}
