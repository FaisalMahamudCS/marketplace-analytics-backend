import { Module } from '@nestjs/common';
import { ResponseDAOModule } from '../persistence/dao/response.dao.module';
import { MarketplaceResponseMongooseRepository } from './marketplace-response.mongoose.repository';
import { MARKETPLACE_RESPONSE_REPOSITORY } from './tokens';

@Module({
  imports: [ResponseDAOModule],
  providers: [
    MarketplaceResponseMongooseRepository,
    {
      provide: MARKETPLACE_RESPONSE_REPOSITORY,
      useExisting: MarketplaceResponseMongooseRepository,
    },
  ],
  exports: [MARKETPLACE_RESPONSE_REPOSITORY],
})
export class RepositoryModule {}
