import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';
import { ResponseGateway } from './response.gateway';
import { SchedulerService } from './scheduler.service';
import { ResponseDAOModule } from './dao/response.dao.module';

@Module({
  imports: [ResponseDAOModule, HttpModule],
  controllers: [ResponseController],
  providers: [ResponseService, ResponseGateway, SchedulerService],
  exports: [ResponseService, ResponseGateway],
})
export class ResponseModule {}
