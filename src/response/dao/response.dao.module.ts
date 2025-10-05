import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Response,
  ResponseSchema,
  MarketplaceResponse,
  MarketplaceResponseSchema,
} from '../schemas/response.schema';
import { MarketplaceResponseDAO, GenericResponseDAO } from './response.dao';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Response.name, schema: ResponseSchema },
      { name: MarketplaceResponse.name, schema: MarketplaceResponseSchema },
    ]),
  ],
  providers: [MarketplaceResponseDAO, GenericResponseDAO],
  exports: [MarketplaceResponseDAO, GenericResponseDAO],
})
export class ResponseDAOModule {}
