import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventsGateway } from './event.gateway';
import { UserRepository } from './repositories/user.repository';
import { ConfigModule } from '@nestjs/config';
import { RoomRepository } from './repositories/room.repository';
import { rateLimit } from 'express-rate-limit';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../client/public'),
    }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: process.env.POSTGRE_USER,
    //   password: process.env.POSTGRE_PASSWORD,
    //   database: process.env.POSTGRE_OGW,
    //   entities: [DrawData],
    //   synchronize: true,
    // }),
    // TypeOrmModule.forFeature([DrawData]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventsGateway,
    UserRepository,
    RoomRepository
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        rateLimit({
          windowMs: 1 * 60 * 1000, // 1 minutes
          max: 60, // limit each IP to 60 requests per windowMs
        }),
      )
      .forRoutes('*');
  }
}
