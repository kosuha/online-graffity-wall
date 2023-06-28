import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    ) {}

  @Get('/image')
  async getImage(): Promise<Object> {
    return { image: await this.appService.getImage() };
  }

  @Get('/users')
  getUsers(): Object {
    return { users: this.appService.getUsers() };
  }
}
