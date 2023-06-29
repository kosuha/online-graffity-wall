import { Injectable } from '@nestjs/common';
import { DrawRepository } from './draw.repository';
import { UserData } from './dataTransferObjects/UserData.dto';
import { UserRepository } from './user.repository';
import { Position } from './dataTransferObjects/Position.dto';
import { Draw } from './dataTransferObjects/Draw.dto';
import { createCanvas } from 'canvas';

@Injectable()
export class AppService {
  constructor (
      private readonly drawRepository: DrawRepository,
      private readonly userRepository: UserRepository,
  ) {}
  
  canvas = createCanvas(2000, 2000);
  context = this.canvas.getContext('2d');
      
  // async generateImage() {
  //   const draws: Draw[] = await this.drawRepository.getAllDraw();
  //   for (let i = 0; i < draws.length; i++) {
  //     this.updateDraw(draws[i]);
  //   }
  // }

  getImage(): string {
    return this.canvas.toDataURL();
  }

  updateDraw(draw: Draw) {
    if (draw.from.x === draw.to.x && draw.from.y === draw.to.y) {
      this.context.beginPath()
      this.context.arc(draw.from.x, draw.from.y, draw.width / 2, 0, Math.PI * 2);
      this.context.fillStyle = draw.color;
      this.context.fill();
      this.context.closePath();
    } else {
      this.context.beginPath()
      this.context.lineJoin = 'round';
      this.context.lineCap = 'round';
      this.context.lineWidth = draw.width;
      this.context.strokeStyle = draw.color;
      this.context.moveTo(draw.from.x, draw.from.y);
      this.context.lineTo(draw.to.x, draw.to.y);
      this.context.stroke();
    }
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

  isValidUser(user: UserData): boolean {
    if (!this.userRepository.isInUsers(user)) return false;
    if (!this.isValidColor(user.color)) return false;
    if (!this.isValidPosition(user.pos)) return false;
    if (!this.isValidWidth(user.width)) return false;
    return true;
  }

  isVaildDraw(user: UserData, draw: Draw): boolean {
    if (user.id !== draw.id) return false;
    if (!user.isDrawing) return false;
    if (user.width !== draw.width) return false;
    if (user.pos.x !== draw.to.x || user.pos.y !== draw.to.y) return false;
    return true;
  }
}
