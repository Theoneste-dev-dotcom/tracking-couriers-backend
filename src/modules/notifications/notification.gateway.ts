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
import { AuthService } from '../auth/auth.service';

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

  constructor(
    private readonly companyService: CompaniesService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {

    const token = client.handshake.auth?.token;

    if (!token) {
      console.log('❌ No token found in handshake.auth!');
      throw new WsException('jwt must be provided');
    }

    try {
      const user = await this.authService.verifyToken(token, true);
      if (user) {
        const existingClientId = this.connectedUsers.get(user.id);

        if(existingClientId && existingClientId !== client.id){
          const oldClient = this.server.sockets.sockets.get(existingClientId);
          if (oldClient) {
            oldClient.disconnect(true)
          }
        }
        console.log("✅ User connected:", user.name, client.id);
        this.connectedUsers.set(user.id, client.id);
        const company = await this.userService.getUserCompany(user.id);
        if (company) {
          client.join(`company-${company.id}`);
        }
     
      }else {
        client.disconnect(true);
      }
    } catch (err) {
      console.error('❌ Token verification failed:', err.message, token);
      client.disconnect(true);
      throw new WsException(err.message);
    }
  }

  handleDisconnect(client: Socket) {
    let userId;

    for (const [key, value] of this.connectedUsers) {
      if (value === client.id) {
        userId = key;
        break;
      }
    }
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log('✅ User disconnected:', userId);
    }
  }

  sendToUser(notification: any, userId?: number) {
    if (!userId) return;
    const clientId = this.connectedUsers.get(userId);
    if (clientId) {
      console.log("notification sent to this client =>", clientId);
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
