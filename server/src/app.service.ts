import { Injectable } from '@nestjs/common';
import { UserData } from './dataTransferObjects/UserData.dto';
import { Position } from './dataTransferObjects/Position.dto';
import { Draw } from './dataTransferObjects/Draw.dto';
import { RoomRepository } from './repositories/room.repository';
import { CanvasData } from './dataTransferObjects/CanvasData.dto';

@Injectable()
export class AppService {
  constructor (
      private readonly roomRepository: RoomRepository,
  ) {}

  getUsers(roomId: string): UserData[] {
    if (!this.roomRepository.rooms.has(roomId)) return undefined;
    return this.roomRepository.rooms.get(roomId).users.getUsers();
  }

  getCanvas(roomId: string): Object[] {
    if (!this.roomRepository.rooms.has(roomId)) return undefined;
    return this.roomRepository.rooms.get(roomId).getCanvas();
  }

  clearCanvas(roomId: string) {
    if (!this.roomRepository.rooms.has(roomId)) return ;
    this.roomRepository.rooms.get(roomId).clear();
  }

  updateDraw(roomId: string, draw: Draw) {
    if (!this.roomRepository.rooms.has(roomId)) return ;
    this.roomRepository.rooms.get(roomId).updataDraw(draw);
  }

  updateUser(roomId: string, userData: UserData): void {
    if (!this.roomRepository.rooms.has(roomId)) return undefined;
    this.roomRepository.rooms.get(roomId).users.updateUser(userData);
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
    if (0 <= width && width <= 200) return true;
    return false;
  }

  isValidUser(roomId: string, user: UserData): boolean {
    if (!this.roomRepository.rooms.has(roomId)) return false;
    if (!this.roomRepository.rooms.get(roomId).users.isInUsers(user)) return false;
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

  loadImage(roomId: string, image: string, id1: string, id2: string) {
    this.roomRepository.rooms.get(roomId).loadImage(image, id1, id2);
  }

  layerMoveStart(roomId: string, id1: string, id2: string) {
    const newCanvasData: CanvasData = this.roomRepository.rooms.get(roomId).canvasList.get(id1);
    newCanvasData.isSelected = true;
    this.roomRepository.rooms.get(roomId).canvasList.delete(id1);
    this.roomRepository.rooms.get(roomId).canvasList.set(id1, newCanvasData);
    this.roomRepository.rooms.get(roomId).canvasList.set(id2, new CanvasData({x: 0, y: 0}, 2000, 2000, false));
  }

  layerMove(roomId: string, id: string, pos: Position) {
    this.roomRepository.rooms.get(roomId).canvasList.get(id).pos = pos;
  }

  layerMoveEnd(roomId: string, id: string) {
    this.roomRepository.rooms.get(roomId).canvasList.get(id).isSelected = false;
  }
}
