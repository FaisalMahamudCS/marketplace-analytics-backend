import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3002',
      'https://marketplace-analytics-dashboard-fro.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Swagger /docs
  const config = new DocumentBuilder()
    .setTitle('BizScout Marketplace Analytics API')
    .setDescription('API documentation for the marketplace analytics backend')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(` Application is running on:${port}`);
  console.log(` HTTP Response Monitor Backend started successfully!`);
}
void bootstrap();
