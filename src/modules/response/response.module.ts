import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResponseService } from './services/response.service';
import { ResponseController } from './controllers/response.controller';
import { ResponseGateway } from './gateways/response.gateway';
import { SchedulerService } from './services/scheduler.service';
import { RepositoryModule } from './repositories/repository.module';

@Module({
  imports: [RepositoryModule, HttpModule],
  controllers: [ResponseController],
  providers: [ResponseService, ResponseGateway, SchedulerService],
  exports: [ResponseService, ResponseGateway],
})
export class ResponseModule {}
