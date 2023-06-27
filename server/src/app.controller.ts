import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    ) {}

  @Post('/image')
  postImage(@Req() req: Request): void {
    this.appService.saveImage((req.body as any).image);
  }

  @Get('/image')
  getImage(): Object {
    return { image: this.appService.getImage() };
  }

  @Get('/users')
  getUsers(): Object {
    return { users: this.appService.getUsers() };
  }
}
