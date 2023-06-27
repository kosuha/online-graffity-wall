import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserData } from './dataTransferObjects/UserData.dto';
import { UserRepository } from './user.repository';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor (
        private readonly userRepository: UserRepository,
    ) {}

    handleConnection(client: Socket, ...args: any[]) {
        let newUser: UserData = {
            id: client.id,
            x: 0,
            y: 0,
            isDrawing: false,
            color: "#000000",
            width: 1
        };
        this.userRepository.pushUser(newUser);
        client.broadcast.emit('connected', { userData: newUser });
    }

    handleDisconnect(client: Socket) {
        let user: UserData = this.userRepository.getUserById(client.id);
        this.userRepository.popUser(user);
        client.broadcast.emit('disconnected', { userData: user });
    }

    @SubscribeMessage('mousemove')
    handleMouseMove(client: Socket, data: UserData) {
        client.broadcast.emit('mousemove', { id: client.id, userData: data });
    }

    @SubscribeMessage('mousedown')
    handleMouseDown(client: Socket, data: UserData) {
        client.broadcast.emit('mousedown', { id: client.id, userData: data });
    }

    @SubscribeMessage('mouseup')
    handleMouseUp(client: Socket, data: UserData) {
        client.broadcast.emit('mouseup', { id: client.id, userData: data });
    }
}