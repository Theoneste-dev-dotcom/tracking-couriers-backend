import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { In, Repository } from 'typeorm';
import { UserService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CompaniesService } from '../companies/companies.service';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import { NotificationsGateway } from './notification.gateway';
import { UserNotification } from './entities/user-notification.entity';

@Injectable()
export class NotificationService {
 

  private readonly twilioClient;
  private readonly emailTransporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notifcationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly companyService: CompaniesService,
    private readonly usersService: UserService,
    private readonly notificationGateway: NotificationsGateway,
  ) {}
  getAllNotifications() {
    return this.notifcationRepository.find();
  }

   async getNotificationsInCompany(companyId: number) {
    const company = await this.companyService.findCompany(companyId)
    if(!company) {
      throw new Error('Company not found')
    }

    const companyLogs = await this.notifcationRepository.findBy({company: {id: company.id},})
    return companyLogs
  
  }
  async getCompanyRelatedNotifications(companyId: number) {
    const company = await this.companyService.findCompany(companyId);

    if (!company) {
      throw new Error('Company not found');
    }

    return this.notifcationRepository.find({
      where: {
        company: { id: companyId },
        type: NotificationType.COMPANY,
      },
      order: { createdAt: 'DESC' },
    });
  }


  async getUserNotifications(userId: number, onlyUnread = false) {
    const where = { user: { id: userId } } as any;
    if (onlyUnread) {
      where.isRead = false;
    }

    return this.userNotificationRepository.find({
      where,
      relations: ['notification'],
      order: { createdAt: 'DESC' },
    });
  }

  async markUserNotificationAsRead(userId: number, notificationId: number) {
    const userNotif = await this.userNotificationRepository.findOne({
      where: {
        user: { id: userId },
        notification: { id: notificationId },
      },
    });

    if (!userNotif) {
      throw new Error('Notification not found for user.');
    }

    userNotif.isRead = true;
    return this.userNotificationRepository.save(userNotif);
  }

  async markAllUsersAsRead(userId: number) {
    const notifications = await this.userNotificationRepository.find({
      where: { user: { id: userId }, isRead: false },
    });

    for (const notif of notifications) {
      notif.isRead = true;
    }
    await this.userNotificationRepository.save(notifications);
  }

  

  async getNotificationByType(
    notificationType: NotificationType,
  ): Promise<Notification[]> {
    let notifications;

    switch (notificationType) {
      case NotificationType.USER:
        notifications = await this.notifcationRepository.find({
          where: { type: notificationType },
          order: { id: 'DESC' },
        });
        break;
      case NotificationType.COMPANY:
        notifications = await this.notifcationRepository.find({
          where: { type: notificationType },
          order: { id: 'DESC' },
        });
        break;
      case NotificationType.SHIPMENT:
        notifications = await this.notifcationRepository.find({
          where: { type: notificationType },
          order: { id: 'DESC' },
        });
        break;
      default:
        notifications = await this.notifcationRepository.find({
          where: { type: notificationType },
          order: { id: 'DESC' },
        });
    }
    return notifications;
  }

  // getting user's clients notifications
  // async getNotificationsByUser(userId: number) {
  //   const user = await this.usersService.findOneById(userId);

  //   if (!user) {
  //     throw new Error('User not Found!!');
  //   }

  //   return this.notifcationRepository.find({
  //     where: { user: { id: userId } },
  //     order: { id: 'DESC' },
  //   });
  // }

  async sendNotificationToEmail(
    notification: CreateNotificationDto,
  ): Promise<void> {
    const user = await this.usersService.findOneById(notification.userId);
    if (!user || !user.email) {
      throw new Error('User not found or email not provided');
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Notification header',
        text: notification.message,
        html: `<p>${notification.message}</p>`,
      });
      // implement send push notification
      // await this.sendNotification();
    } catch (error) {
      console.error('Error sending email notification', error);
      throw new Error('Failed to send email notification');
    }
  }

  async sendNotificationToPhone(
    notification: CreateNotificationDto,
  ): Promise<void> {
    const user = await this.usersService.findOneById(notification.userId);
    if (!user || !user.phone) {
      throw new Error('User not found or phone number not provided');
    }

    try {
      await this.twilioClient.messages.create({
        body: notification.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone,
      });

      // Implement the send push notifications
      // await this.sendNotification(userId, 'SMS', message);
    } catch (error) {
      console.error('Error sending SMS notification', error);
      throw new Error('Failed to send SMS notification');
    }
  }

  // ... existing code ...



  // async getUserRelatedNotifications(userId: number) {
  //   const user = await this.usersService.findOneById(userId);

  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   return this.notifcationRepository.find({
  //     where: {
  //       user: { id: userId },
  //       type: NotificationType.USER,
  //     },
  //     order: { createdAt: 'DESC' },
  //   });
  // }

  // async getShipmentRelatedNotifications(userId: number, companyId?: number) {
  //   const user = await this.usersService.findOneById(userId);

  //   if (companyId) {
  //     const company = this.companyService.findCompany(companyId);
  //   }

  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   // if no company id provided
  //   if (!companyId) {
  //     return this.notifcationRepository.find({
  //       where: {
  //         user: { id: userId },
  //         type: NotificationType.SHIPMENT,
  //       },
  //       order: { createdAt: 'DESC' },
  //     });
  //   } else {
  //     return this.notifcationRepository.find({
  //       where: {
  //         user: { id: userId },
  //         type: NotificationType.SHIPMENT,
  //       },
  //       order: { createdAt: 'DESC' },
  //     });
  //   }
  //   // if company id provided
  // }

  // async getSubscriptionRelatedNotifications(companyId: number) {
  //   const company = await this.companyService.findCompany(companyId);

  //   if (!company) {
  //     throw new Error('User not found');
  //   }

  //   return this.notifcationRepository.find({
  //     where: {
  //       company: { id: companyId },
  //       type: NotificationType.SUBSCRIPTION,
  //     },
  //     order: { createdAt: 'DESC' },
  //   });
  // }
}
