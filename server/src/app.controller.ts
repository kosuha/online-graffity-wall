import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    ) {}

  @Post('/canvas')
  getCanvas(@Req() req: Request): Object {
    return { canvas: this.appService.getCanvas((req as any).body.id) };
  }

  @Post('/users')
  getUsers(@Req() req: Request): Object {
    return { users: this.appService.getUsers((req as any).body.id) };
  }

  @Post('/image')
  loadImage(@Req() req: Request): void {
    console.log(req.body);
  }
}
