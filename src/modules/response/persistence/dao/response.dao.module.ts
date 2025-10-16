import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Response,
  ResponseSchema,
  MarketplaceResponse,
  MarketplaceResponseSchema,
} from '../../schemas/response.schema';
import { MarketplaceResponseDAO, GenericResponseDAO } from './response.dao';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Response.name as string, schema: ResponseSchema },
      {
        name: MarketplaceResponse.name as string,
        schema: MarketplaceResponseSchema,
      },
    ]),
  ],
  providers: [MarketplaceResponseDAO, GenericResponseDAO],
  exports: [MarketplaceResponseDAO, GenericResponseDAO],
})
export class ResponseDAOModule {}
