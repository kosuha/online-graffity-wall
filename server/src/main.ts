import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule);
  // server.get('*', (_req: any, _res: any) => {
  //   _res.sendFile(join(__dirname, '..', '../client/build/index.html'));
  // });
  app.use(express.json({ limit: '2mb' }));
  await app.listen(3000);
}
bootstrap();
