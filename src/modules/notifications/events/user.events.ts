// notifications/events/user.events.ts
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifServices.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserEvents {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('user.created')
  async handleUserCreated(userId: number) {
    await this.notificationsService.handleUserEvent(userId, 'added');
  }

  @OnEvent('user.updated')
  async handleUserUpdated(userId: number) {
    await this.notificationsService.handleUserEvent(userId, 'updated');
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(userId: number) {
    await this.notificationsService.handleUserEvent(userId, 'deleted');
  }
}