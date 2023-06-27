import { Injectable } from '@nestjs/common';
import { ImageRepository } from './image.repository';
import { UserData } from './dataTransferObjects/UserData.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class AppService {
    constructor (
        private readonly imageRepository: ImageRepository,
        private readonly userRepository: UserRepository,
    ) {}

  saveImage(data: string): void {
    this.imageRepository.saveImage(data);
  }

  getImage(): string {
    return this.imageRepository.getImage();
  }

  getUsers(): UserData[] {
    return this.userRepository.getUsers();
  }
}
