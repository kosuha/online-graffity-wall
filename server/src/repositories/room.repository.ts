import { Injectable } from '@nestjs/common';
import { Room } from 'src/dataTransferObjects/Room.dto';

@Injectable()
export class RoomRepository {
    rooms: Map<string, Room> = new Map();

    pushRoom(id: string) {
        this.rooms.set(id, new Room());
        for (const [id, room] of this.rooms) {
            if (room.users.users.length === 0) {
                this.rooms.delete(id);
            }
        }
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