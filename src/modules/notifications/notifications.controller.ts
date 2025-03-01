import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: number) {
    return await this.notificationsService.getNotificationsByUser(userId)
  }

  @Post()
  async sendNotification(@Body() notificationDto) {
    return await this.notificationsService.sendNotification(notificationDto);
  }


  @Post('email')
  async sendEmailNotification(
    @Body('userId') userId: number,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ): Promise<void> {
    await this.notificationsService.sendNotificationToEmail(
      userId,
      subject,
      message,
    );
  }

  @Post('phone')
  async sendPhoneNotification(
    @Body('userId') userId: number,
    @Body('message') message: string,
  ): Promise<void> {
    await this.notificationsService.sendNotificationToPhone(userId, message);
  }
}
