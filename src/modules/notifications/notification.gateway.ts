// notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserService } from '../users/users.service';

@UseGuards(AuthGuard)
@WebSocketGateway({
  cors: { origin: '*' },
  // namespace: '/notifications'
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<number, string>();
  authService: any;

  constructor(
    private readonly companyService: CompaniesService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    console.log('client connected Success with id ' + client.id);
    const token = client.handshake.auth?.token;

    if (!token) {
      console.log('❌ No token found in handshake.auth!');
      throw new WsException('jwt must be provided');
    }

    try {
      const user = await this.authService.verifyToken(token, true);
      this.connectedUsers.set(user.sub, client.id);
      const company = await this.userService.getUserCompany(user.sub);
      console.log('company is => ', company);
      if (company) {
        client.join(`company-${company.id}`);
      }
      console.log('✅ User connected:', user?.username);
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      console.log('the connected users are => ', this.connectedUsers);
      client.disconnect(true);
      throw new WsException(err.message);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.handshake.auth.user;
    this.connectedUsers.delete(user.sub);
  }

  sendToUser(notification: any, userId?: number) {
    console.log('notification sent to user =>', userId, notification);
    if (!userId) return;
    const clientId = this.connectedUsers.get(userId);
    if (clientId) {
      this.server.to(clientId).emit('new-notification', notification);
    }
  }

  sendToCompany(companyId: number, notification: any) {
    this.server
      .to(`company-${companyId}`)
      .emit('company-notification', notification);
  }

  registerClient(userId: number, clientId: string) {
    this.connectedUsers.set(userId, clientId);
  }

  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);

    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
