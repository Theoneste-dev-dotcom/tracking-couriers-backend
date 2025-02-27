import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async sendNotification(notificationDto) {
    console.log('Sending notification:', notificationDto);
    // Here, you can integrate with an SMS/email service
    return { success: true, message: 'Notification sent' };
  }

  async getUserNotifications(userId: string) {
    console.log(`Fetching notifications for user ${userId}`);
    return [{ id: 1, message: 'Shipment update', seen: false }];
  }
}
