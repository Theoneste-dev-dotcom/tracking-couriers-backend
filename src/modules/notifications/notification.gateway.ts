// notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import { AuthGuard } from '../auth/auth.guard';


@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications'
})
@UseGuards(AuthGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<number, string>();

  constructor(private readonly companyService: CompaniesService) {}

  async handleConnection(client: Socket) {
    try {
      const user = client.handshake.auth.user;
      this.connectedUsers.set(user.sub, client.id);
      
      // Join company-specific room if applicable
      const company = await this.companyService.getUserCompany(user.sub);
      if (company) {
        client.join(`company-${company.id}`);
      }
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.handshake.auth.user;
    this.connectedUsers.delete(user.sub);
  }

  sendToUser( notification: any , userId?: number,) {
    const clientId = this.connectedUsers.get(userId? userId: 0);
    if (clientId) {
      this.server.to(clientId).emit('new-notification', notification);
    }
  }

  sendToCompany(companyId: number, notification: any) {
    this.server.to(`company-${companyId}`).emit('company-notification', notification);
  }
}