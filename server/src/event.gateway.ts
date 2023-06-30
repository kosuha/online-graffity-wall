import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserData } from './dataTransferObjects/UserData.dto';
import { UserRepository } from './repositories/user.repository';
import { Draw } from './dataTransferObjects/Draw.dto';
import { AppService } from './app.service';
import { RoomRepository } from './repositories/room.repository';
import { Room } from './dataTransferObjects/Room.dto';
import { JoinData } from './dataTransferObjects/JoinData.dto';

interface MouseMoveData {
    roomId: string;
    user: UserData;
    draw: Draw;
}

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor (
        private readonly roomRepository: RoomRepository,
        private readonly appService: AppService,
    ) {}

    handleConnection(client: Socket, ...args: any[]) {
        let newUser: UserData = {
            id: client.id,
            pos: { x: 0, y: 0 },
            isDrawing: false,
            color: "#000000",
            width: 1
        };
        client.broadcast.emit('connected', newUser);
    }

    handleDisconnect(client: Socket) {
        // let user: UserData = this.userRepository.getUserById(client.id);
        // this.userRepository.popUser(user);
        
        
        for (let id of this.roomRepository.rooms.keys()) {
            for (let i = 0; i < this.roomRepository.rooms.get(id).users.users.length; i++) {
                if (this.roomRepository.rooms.get(id).users.users[i].id === client.id) {
                    client.to(id).emit("disconnected", client.id);
                }
            }
        }
        this.roomRepository.leaveAllRooms(client.id);
    }

    @SubscribeMessage('join')
    handleJoinRoom(client: Socket, data: JoinData) {
        data.user.id = client.id;
        
        client.join(data.roomId);
        if (!this.roomRepository.rooms.has(data.roomId)) {
            this.roomRepository.rooms.set(data.roomId, new Room());
        }
        this.roomRepository.rooms.get(data.roomId).users.pushUser(data.user);
        client.broadcast.to(data.roomId).emit('join', data.user);
    }

    @SubscribeMessage('leave')
    handleLeaveRoom(client: Socket, data: JoinData) {
        client.to(data.roomId).emit("leave", data.user.id);
        this.roomRepository.rooms.get(data.roomId).users.popUser(data.user.id);
        client.leave(data.roomId);
    }

    @SubscribeMessage('mousemove')
    handleMouseMove(client: Socket, data: MouseMoveData) {
        
        if (!this.appService.isValidUser(data.roomId, data.user)) return;
        this.appService.updateUser(data.roomId, data.user);
        if (data.draw !== undefined) {
            if (!this.appService.isVaildDraw(data.user, data.draw)) return;
            this.appService.updateDraw(data.roomId, data.draw);
        }
        client.broadcast.to(data.roomId).emit('mousemove', data);
    }

    @SubscribeMessage('clear')
    handleClear(client: Socket, data: JoinData) {
        if (data.roomId === "lobby") return ;
        if (!this.appService.isValidUser(data.roomId, data.user)) return;
        this.appService.updateUser(data.roomId, data.user);

        this.appService.clearCanvas(data.roomId);
        client.broadcast.to(data.roomId).emit('clear');
    }
}