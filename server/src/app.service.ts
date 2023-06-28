import { Injectable } from '@nestjs/common';
import { DrawRepository } from './draw.repository';
import { UserData } from './dataTransferObjects/UserData.dto';
import { UserRepository } from './user.repository';
import { Position } from './dataTransferObjects/Position.dto';
import { Draw } from './dataTransferObjects/Draw.dto';

@Injectable()
export class AppService {
    constructor (
        private readonly drawRepository: DrawRepository,
        private readonly userRepository: UserRepository,
    ) {}

  async getImage(): Promise<Draw[]> {
    return await this.drawRepository.getAllDraw();
  }

  getUsers(): UserData[] {
    return this.userRepository.getUsers();
  }

  updateUser(userData: UserData): void {
    this.userRepository.updateUser(userData);
  }

  isValidColor(color: string): boolean {
    const hex6 = /^#([0-9a-fA-F]{6})$/i;
    const rgb = /^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/;
    return hex6.test(color) || rgb.test(color);
  }

  isValidPosition(pos: Position): boolean {
    if (pos.x <= 2000 && pos.y <= 2000) return true;
    return false;
  }

  isValidWidth(width: number): boolean {
    if (0 <= width && width <= 50) return true;
    return false;
  }
}
