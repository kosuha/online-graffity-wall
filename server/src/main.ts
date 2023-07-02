import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '2mb' }));
  await app.listen(3000);
}
bootstrap();
