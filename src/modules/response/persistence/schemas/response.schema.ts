import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketplaceResponseDocument = MarketplaceResponse & Document;

@Schema({ timestamps: true })
export class MarketplaceData {
  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true, min: 50, max: 250 })
  activeDeals: number;

  @Prop({ required: true, min: 0, max: 9 })
  newDeals: number;

  @Prop({ required: true, min: 5000, max: 55000 })
  averageDealValueUSD: number;

  @Prop({ required: true, min: 0, max: 29 })
  offersSubmitted: number;

  @Prop({ required: true, min: 0, max: 499 })
  userViews: number;
  @Prop({
    required: true,
    enum: [
      'Electronics',
      'Agriculture',
      'Manufacturing',
      'Entertainment',
      'Education',
      'Technology',
    ],
  })
  category: string;

  // Index signature to satisfy Record<string, unknown>
  [key: string]: unknown;
}

@Schema({ timestamps: true })
export class MarketplaceResponse {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  method: string;

  @Prop({ type: MarketplaceData, required: true })
  marketplaceData: MarketplaceData;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ type: Object })
  responseData: any;

  @Prop({ required: true })
  responseTime: number; // in milliseconds

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  error?: string;
}

export const MarketplaceDataSchema =
  SchemaFactory.createForClass(MarketplaceData);
export const MarketplaceResponseSchema =
  SchemaFactory.createForClass(MarketplaceResponse);

// Keep the original generic schema for backward compatibility
export type ResponseDocument = Response & Document;

@Schema({ timestamps: true })
export class Response {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  method: string;

  @Prop({ type: Object })
  requestPayload: any;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ type: Object })
  responseData: any;

  @Prop({ required: true })
  responseTime: number; // in milliseconds

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  error?: string;
}

export const ResponseSchema = SchemaFactory.createForClass(Response);
