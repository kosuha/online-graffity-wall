import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    ) {}

  @Post('/image')
  getImage(@Req() req: Request): Object {
    return { image: this.appService.getImage((req as any).body.id) };
  }

  @Post('/users')
  getUsers(@Req() req: Request): Object {
    return { users: this.appService.getUsers((req as any).body.id) };
  }
}
