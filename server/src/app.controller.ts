import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ImageRepository } from './image.repository';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly imageRepository: ImageRepository,
    ) {}

  @Post('/image')
  postImage(@Req() req: Request): void {
    this.appService.saveImage((req.body as any).image);
  }

  @Get('/image')
  getImage(): Object {
    return { image: this.appService.getImage() };
  }
}
