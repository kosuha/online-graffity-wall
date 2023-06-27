import { Injectable } from '@nestjs/common';
import { ImageRepository } from './image.repository';

@Injectable()
export class AppService {
    constructor (
        private readonly imageRepository: ImageRepository
    ) {}

  saveImage(data: string): void {
    this.imageRepository.saveImage(data);
  }

  getImage(): string {
    return this.imageRepository.getImage();
  }
}
