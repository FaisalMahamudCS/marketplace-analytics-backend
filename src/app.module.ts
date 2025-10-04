import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ResponseModule } from './response/response.module';

@Module({
  imports: [
    // Load .env variables
    ConfigModule.forRoot({ isGlobal: true }),

    // Use env variable for MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://localhost:27017/marketplace-analytics',
    ),

    ScheduleModule.forRoot(),
    HttpModule,
    ResponseModule,
  ],
})
export class AppModule {}
