import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Subscription } from 'src/common/decorators/subscription.decorator';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { NotificationType } from 'src/common/enums/notitication-type.enum';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  // simple sending notification via web sockets
  // @Post()
  // @ApiOperation({ summary: 'Create a new notification' })
  // async createNotification(
  //   @Body() createNotificationDto: CreateNotificationDto,
  // ) {
  //   return this.notificationsService.sendNotification(createNotificationDto);
  // }

  // @Get('user/:userId')
  // @ApiOperation({ summary: 'Get all notifications for a user' })
  // async getUserNotifications(@Param('userId') userId: number) {
  //   return this.notificationsService.getNotificationsByUser(userId);
  // }

  // @Get('company/:companyId')
  // @ApiOperation({ summary: 'Get company related notifications' })
  // async getCompanyNotifications(@Param('companyId') companyId: number) {
  //   return this.notificationsService.getCompanyRelatedNotifications(companyId);
  // }

  // @Get('user-related/:userId')
  // @ApiOperation({ summary: 'Get user related notifications' })
  // async getUserRelatedNotifications(@Param('userId') userId: number) {
  //   return this.notificationsService.getUserRelatedNotifications(userId);
  // }

  // @Get('shipment/:userId')
  // @Get('shipment/:userId/:companyId')
  // @ApiOperation({ summary: 'Get shipment related notifications' })
  // async getShipmentNotifications(
  //   @Param('userId') userId: number,
  //   @Param('companyId') companyId?: number,
  // ) {
  //   return this.notificationsService.getShipmentRelatedNotifications(
  //     userId,
  //     companyId,
  //   );
  // }

  // @Get('subscription/:companyId')
  // @ApiOperation({ summary: 'Get subscription related notifications' })
  // async getSubscriptionNotifications(@Param('companyId') companyId: number) {
  //   return this.notificationsService.getSubscriptionRelatedNotifications(
  //     companyId,
  //   );
  // }

  // @Put(':id/mark-seen')
  // @ApiOperation({ summary: 'Mark a notification as seen' })
  // async markNotificationAsSeen(@Param('id') id: number) {
  //   return this.notificationsService.markNotificationAsSeen(id);
  // }

  // get all notifications
  @Get()
  async getAllNotifications() {
    return this.notificationsService.getAllNotifications();
  }

  // get notifcation by type
  @Get("type/:type")
  async getNotifByType(@Param('type') type: NotificationType) {
    return this.notificationsService.getNotificationByType(type);
  }

  @Put("/company/:companyId/mark-as-read")
async markCompanyNotificationsAsRead(@Param('companyId') companyId: number) {
  return this.notificationsService.markNotificationsAsRead(companyId);
}



  @Get("/company/:companyId")
  async getCompanyLogs(@Param('companyId') companyId: number) {
    return this.notificationsService.getNotificationsInCompany(companyId)
  }

  @Subscription(SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM)
  @Post('email')
  @ApiOperation({ summary: 'Send email notification' })
  async sendEmailNotification(@Body() notification) {
    return this.notificationsService.sendNotificationToEmail(notification);
  }

  @Subscription(SubscriptionPlan.PREMIUM)
  @Post('sms')
  @ApiOperation({ summary: 'Send SMS notification' })
  async sendSMSNotification(
    @Body() notification,
  ) {
    return this.notificationsService.sendNotificationToPhone(
      notification
    );
  }
}
