import { MarketplaceResponseDocument } from '../persistence/schemas/response.schema';
import {
  ResponseStats,
  MarketplaceResponseWithData,
} from '../persistence/dao/interfaces/response.dao.interface';

export abstract class MarketplaceResponseRepository {
  abstract create(
    responseData: Record<string, unknown>,
  ): Promise<MarketplaceResponseDocument>;
  abstract findAll(
    limit: number,
    offset: number,
  ): Promise<MarketplaceResponseWithData[]>;
  abstract findById(id: string): Promise<MarketplaceResponseWithData | null>;
  abstract findLatest(): Promise<MarketplaceResponseWithData | null>;
  abstract getStats(): Promise<ResponseStats>;
}
