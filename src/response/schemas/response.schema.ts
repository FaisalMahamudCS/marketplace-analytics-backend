import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
