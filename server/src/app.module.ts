import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventsGateway } from './event.gateway';
import { ImageRepository } from './image.repository';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../client/build'),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventsGateway,
    ImageRepository
  ],
})
export class AppModule {}
