import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { Draw } from 'src/dataTransferObjects/Draw.dto';
import { Room } from 'src/dataTransferObjects/Room.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class RoomRepository {
    rooms: Map<string, Room> = new Map();

    pushRoom(id: string) {
        this.rooms.set(id, new Room());
    }

    popRoom(id: string): void {
        this.rooms.delete(id);
    }

    leaveAllRooms(id: string) {
        for (let room of this.rooms.values()) {
            for (let i = 0; i < room.users.users.length; i++) {
                if (room.users.users[i].id === id) {
                    room.users.popUser(id);
                }
            }
        }
    }
}