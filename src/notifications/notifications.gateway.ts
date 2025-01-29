import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() userId: string) {
    this.server.emit(`user-${userId}`, 'Subscribed to notifications');
  }

  notifyUser(userId: number, message: string) {
    this.server.emit(`user-${userId}`, message);
  }
}