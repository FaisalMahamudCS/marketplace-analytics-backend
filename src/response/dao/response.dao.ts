import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MarketplaceResponse,
  MarketplaceResponseDocument,
  Response,
  ResponseDocument,
} from '../schemas/response.schema';
import {
  IMarketplaceResponseDAO,
  IGenericResponseDAO,
  ResponseStats,
  MarketplaceResponseWithData,
} from './interfaces/response.dao.interface';

@Injectable()
export class MarketplaceResponseDAO implements IMarketplaceResponseDAO {
  constructor(
    @InjectModel(MarketplaceResponse.name)
    private readonly marketplaceResponseModel: Model<MarketplaceResponseDocument>,
  ) {}

  async create(
    responseData: Record<string, unknown>,
  ): Promise<MarketplaceResponseDocument> {
    // Use model.create for simpler construction/mocking
    return await this.marketplaceResponseModel.create(responseData as any);
  }

  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<MarketplaceResponseWithData[]> {
    return await this.marketplaceResponseModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async findLatest(): Promise<MarketplaceResponseWithData | null> {
    return await this.marketplaceResponseModel
      .findOne()
      .sort({ timestamp: -1 })
      .exec();
  }

  async getStats(): Promise<ResponseStats> {
    const [total, successful, failed, avgResponseTime] = await Promise.all([
      this.countDocuments(),
      this.countSuccessful(),
      this.countFailed(),
      this.getAverageResponseTime(),
    ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageResponseTime: avgResponseTime,
    };
  }

  async countDocuments(): Promise<number> {
    return await this.marketplaceResponseModel.countDocuments();
  }

  async countSuccessful(): Promise<number> {
    return await this.marketplaceResponseModel.countDocuments({
      statusCode: { $gte: 200, $lt: 400 },
    });
  }

  async countFailed(): Promise<number> {
    return await this.marketplaceResponseModel.countDocuments({
      statusCode: { $gte: 400 },
    });
  }

  async getAverageResponseTime(): Promise<number> {
    const result: Array<{ _id: unknown; avgTime?: number }> =
      await this.marketplaceResponseModel.aggregate([
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
      ]);
    return result[0]?.avgTime ?? 0;
  }
}

@Injectable()
export class GenericResponseDAO implements IGenericResponseDAO {
  constructor(
    @InjectModel(Response.name)
    private readonly responseModel: Model<ResponseDocument>,
  ) {}

  async create(
    responseData: Record<string, unknown>,
  ): Promise<ResponseDocument> {
    const response = new this.responseModel(responseData);
    return await response.save();
  }

  async findAll(
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

  async findLatest(): Promise<ResponseDocument | null> {
    return await this.responseModel.findOne().sort({ timestamp: -1 }).exec();
  }

  async getStats(): Promise<ResponseStats> {
    const total = await this.responseModel.countDocuments();
    const successful = await this.responseModel.countDocuments({
      statusCode: { $gte: 200, $lt: 400 },
    });
    const failed = await this.responseModel.countDocuments({
      statusCode: { $gte: 400 },
    });

    const avgResponseTime: Array<{ _id: unknown; avgTime?: number }> =
      await this.responseModel.aggregate([
        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
      ]);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageResponseTime: avgResponseTime[0]?.avgTime ?? 0,
    };
  }
}
