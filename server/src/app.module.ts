import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventsGateway } from './event.gateway';
import { DrawRepository } from './draw.repository';
import { UserRepository } from './user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawData } from './drawdata.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../client/build'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.POSTGRE_USER,
      password: process.env.POSTGRE_PASSWORD,
      database: process.env.POSTGRE_OGW,
      entities: [DrawData],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([DrawData]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventsGateway,
    DrawRepository,
    UserRepository
  ],
})
export class AppModule {}
