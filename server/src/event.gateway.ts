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
import { Draw } from './dataTransferObjects/Draw.dto';
import { AppService } from './app.service';
import { DrawRepository } from './draw.repository';

interface MouseMoveData {
    user: UserData;
    draw: Draw;
}

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor (
        private readonly userRepository: UserRepository,
        private readonly drawRepository: DrawRepository,
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
        this.userRepository.pushUser(newUser);
        client.broadcast.emit('connected', newUser);
    }

    handleDisconnect(client: Socket) {
        let user: UserData = this.userRepository.getUserById(client.id);
        this.userRepository.popUser(user);
        client.broadcast.emit('disconnected', user);
    }

    @SubscribeMessage('mousemove')
    handleMouseMove(client: Socket, data: MouseMoveData) {
        if (!this.appService.isValidColor(data.user.color)) return;
        if (!this.appService.isValidPosition(data.user.pos)) return;
        if (!this.appService.isValidWidth(data.user.width)) return;
        client.broadcast.emit('mousemove', data);
        if (data.draw !== undefined) {
            this.drawRepository.insertData(data.draw);
        }
    }

    // @SubscribeMessage('draw')
    // handleDraw(client: Socket, data: DrawData) {
    //     client.broadcast.emit('draw', data);
    // }

    // @SubscribeMessage('mousedown')
    // handleMouseDown(client: Socket, data: UserData) {
    //     client.broadcast.emit('mousedown', { id: client.id, userData: data });
    // }

    // @SubscribeMessage('mouseup')
    // handleMouseUp(client: Socket, data: UserData) {
    //     client.broadcast.emit('mouseup', { id: client.id, userData: data });
    // }
}