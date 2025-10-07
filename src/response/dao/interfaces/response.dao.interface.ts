import {
  MarketplaceResponseDocument,
  MarketplaceData,
  ResponseDocument,
} from '../../schemas/response.schema';

export { MarketplaceData } from '../../schemas/response.schema';

export interface ResponseStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageResponseTime: number;
}

export interface MarketplaceResponseWithData
  extends MarketplaceResponseDocument {
  marketplaceData: MarketplaceData;
}

export interface IMarketplaceResponseDAO {
  create(
    responseData: Record<string, unknown>,
  ): Promise<MarketplaceResponseDocument>;
  findAll(
    limit: number,
    offset: number,
  ): Promise<MarketplaceResponseWithData[]>;
  findLatest(): Promise<MarketplaceResponseWithData | null>;
  getStats(): Promise<ResponseStats>;
  countDocuments(): Promise<number>;
  countSuccessful(): Promise<number>;
  countFailed(): Promise<number>;
  getAverageResponseTime(): Promise<number>;
}

export interface IGenericResponseDAO {
  create(responseData: Record<string, unknown>): Promise<ResponseDocument>;
  findAll(limit: number, offset: number): Promise<ResponseDocument[]>;
  findLatest(): Promise<ResponseDocument | null>;
  getStats(): Promise<ResponseStats>;
}
