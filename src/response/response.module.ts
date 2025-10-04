import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Response, ResponseSchema } from './schemas/response.schema';
import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';
import { ResponseGateway } from './response.gateway';
import { SchedulerService } from './scheduler.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Response.name, schema: ResponseSchema },
        ]),
        HttpModule,
    ],
    controllers: [ResponseController],
    providers: [ResponseService, ResponseGateway, SchedulerService],
    exports: [ResponseService, ResponseGateway],
})
export class ResponseModule { }
