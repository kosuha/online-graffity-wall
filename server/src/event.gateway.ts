import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserData } from './dataTransferObjects/UserData.dto';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    handleConnection(client: Socket, ...args: any[]) {
        client.broadcast.emit('connected', { id: client.id });
    }

    handleDisconnect(client: Socket) {
        client.broadcast.emit('disconnected', { id: client.id });
    }

    @SubscribeMessage('mousemove')
    handleMouseMove(client: Socket, data: UserData) {
        // console.log(data);
        client.broadcast.emit('mousemove', { id: client.id, userData: data });
    }

    @SubscribeMessage('mousedown')
    handleMouseDown(client: Socket, data: UserData) {
        // console.log(data);
        client.broadcast.emit('mousedown', { id: client.id, userData: data });
    }

    @SubscribeMessage('mouseup')
    handleMouseUp(client: Socket, data: UserData) {
        // console.log(data);
        client.broadcast.emit('mouseup', { id: client.id, userData: data });
    }
}