import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, payload: { dealerId: string }) {
    if (payload && payload.dealerId) {
      client.join(`dealer:${payload.dealerId}`);
      return { success: true, room: `dealer:${payload.dealerId}` };
    }
    return { success: false, error: 'Invalid dealerId' };
  }

  emitToDealer(dealerId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`dealer:${dealerId}`).emit(event, payload);
    }
  }
}
