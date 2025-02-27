import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return await this.notificationsService.getUserNotifications(userId);
  }

  @Post()
  async sendNotification(@Body() notificationDto) {
    return await this.notificationsService.sendNotification(notificationDto);
  }
}
