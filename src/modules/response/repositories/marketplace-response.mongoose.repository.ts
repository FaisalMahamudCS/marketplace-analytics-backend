import { Injectable } from '@nestjs/common';
import { MarketplaceResponseRepository } from './marketplace-response.repository';
import { MarketplaceResponseDAO } from '../persistence/dao/response.dao';
import { MarketplaceResponseDocument } from '../persistence/schemas/response.schema';
import {
  ResponseStats,
  MarketplaceResponseWithData,
} from '../persistence/dao/interfaces/response.dao.interface';

@Injectable()
export class MarketplaceResponseMongooseRepository
  implements MarketplaceResponseRepository
{
  constructor(private readonly dao: MarketplaceResponseDAO) {}

  async create(
    responseData: Record<string, unknown>,
  ): Promise<MarketplaceResponseDocument> {
    return await this.dao.create(responseData);
  }

  async findAll(
    limit: number,
    offset: number,
  ): Promise<MarketplaceResponseWithData[]> {
    return await this.dao.findAll(limit, offset);
  }

  async findLatest(): Promise<MarketplaceResponseWithData | null> {
    return await this.dao.findLatest();
  }
  async findById(id: string): Promise<MarketplaceResponseWithData | null> {
    const result = await this.dao.findById(id);
    // Fix: make sure the result matches the MarketplaceResponseWithData type (result could be a plain MarketplaceResponse or undefined)
    if (!result) {
      return null;
    }
    // If further transformation is needed to fit the type, do it here.
    return result as MarketplaceResponseWithData;
  }

  async getStats(): Promise<ResponseStats> {
    return await this.dao.getStats();
  }
}
