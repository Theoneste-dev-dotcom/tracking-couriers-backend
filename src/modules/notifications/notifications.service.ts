import { Inject, Injectable } from '@nestjs/common';
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
import { CompanyNotification } from './entities/company-notification.entity';

@Injectable()
export class NotificationService {
  private readonly twilioClient;
  private readonly emailTransporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,

    @InjectRepository(CompanyNotification)
    private readonly companyNotificationRepository: Repository<CompanyNotification>,
    
    private readonly companyService: CompaniesService,
    private readonly usersService: UserService,
    private readonly notificationGateway: NotificationsGateway,
  ) {}
  getAllNotifications() {
    return this.notificationRepository.find({
      relations: ['userNotifications', 'companyNotifications'],
      order: { createdAt: 'DESC' },
    });
  }

  async createCompanyNotification(
    companyId: number,
    message: string,
    type: NotificationType = NotificationType.COMPANY,
  ): Promise<CompanyNotification> {
    const company = await this.companyService.findOne(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const notification = this.notificationRepository.create({
      message,
      type,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    const companyNotification = this.companyNotificationRepository.create({
      company,
      notification: savedNotification,
    });
    const savedCompanyNotification =
      await this.companyNotificationRepository.save(companyNotification);

    // Emit real-time notification
    this.notificationGateway.sendToCompany(companyId, savedCompanyNotification);

    return savedCompanyNotification;
  } // Create a user-specific notification
  async createUserNotification(
    userId: number,
    message: string,
    type: NotificationType = NotificationType.USER,
  ): Promise<UserNotification> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const notification = this.notificationRepository.create({
      message,
      type,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    const userNotification = this.userNotificationRepository.create({
      user,
      notification: savedNotification,
      isRead: false,
    });
    const savedUserNotification =
      await this.userNotificationRepository.save(userNotification);

    // Emit real-time notification (assuming notifyUser exists in NotificationsGateway)
    this.notificationGateway.sendToUser(savedUserNotification, userId);

    return savedUserNotification;
  }

  // Get notifications for a company
  async getNotificationsInCompany(
    companyId: number,
  ): Promise<CompanyNotification[]> {
    const company = await this.companyService.findOne(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return this.companyNotificationRepository.find({
      where: { company: { id: companyId } },
      relations: ['notification', 'company'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get user notifications
  async getUserNotifications(
    userId: number,
    onlyUnread: boolean = false,
  ): Promise<UserNotification[]> {
    const where: any = { user: { id: userId } };
    if (onlyUnread) {
      where.isRead = false;
    }

    return this.userNotificationRepository.find({
      where,
      relations: ['notification', 'user'],
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

  async markAllUserNotficationAsRead(userId: number): Promise<void> {
    const notifications = await this.userNotificationRepository.find({
      where: { user: { id: userId }, isRead: false },
    });

    for (const notif of notifications) {
      notif.isRead = true;
    }
    await this.userNotificationRepository.save(notifications);
  }

  // Get notifications by type
  async getNotificationsByType(
    notificationType: NotificationType,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { type: notificationType },
      relations: ['userNotifications', 'companyNotifications'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get shipment-related notifications
  async getShipmentRelatedNotifications(
    userId: number,
    companyId?: number,
    onlyUnread: boolean = false,
  ): Promise<UserNotification[] | CompanyNotification[]> {
    if (companyId) {
      const company = await this.companyService.findOne(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const where: any = {
        company: { id: companyId },
        notification: { type: NotificationType.SHIPMENT },
      };
      if (onlyUnread) {
        where.isRead = false;
      }

      return this.companyNotificationRepository.find({
        where,
        relations: ['notification', 'company'],
        order: { createdAt: 'DESC' },
      });
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const where: any = {
      user: { id: userId },
      notification: { type: NotificationType.SHIPMENT },
    };
    if (onlyUnread) {
      where.isRead = false;
    }

    return this.userNotificationRepository.find({
      where,
      relations: ['notification', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get subscription-related notifications
  async getSubscriptionRelatedNotifications(
    companyId: number,
    onlyUnread: boolean = false,
  ): Promise<CompanyNotification[]> {
    const company = await this.companyService.findOne(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const where: any = {
      company: { id: companyId },
      notification: { type: NotificationType.SUBSCRIPTION },
    };
    if (onlyUnread) {
      where.isRead = false;
    }

    return this.companyNotificationRepository.find({
      where,
      relations: ['notification', 'company'],
      order: { createdAt: 'DESC' },
    });
  }
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
}
