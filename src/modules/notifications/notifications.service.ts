import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { In, Repository } from 'typeorm';
import { UserService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CompaniesService } from '../companies/companies.service';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly twilioClient;
  private readonly emailTransporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notifcationRepository: Repository<Notification>,
    private readonly companyService: CompaniesService,
    private readonly usersService: UserService,
  ) {}
  async sendNotification(
    notificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const user = this.usersService.findOneById(notificationDto.userId);

    if (!user) {
      throw new Error('User not Founc');
    }

    const notificaion = this.notifcationRepository.create(notificationDto);
    return this.notifcationRepository.save(notificaion);
  }

  async markNotificationAsSeen(notificationId: number): Promise<Notification> {
    const notificaion = await this.notifcationRepository.findOneBy({
      id: notificationId,
    });

    if (!notificaion) {
      throw new Error('Notification not found');
    }
    notificaion.seen = true;

    return this.notifcationRepository.save(notificaion);
  }

  // getting user's clients notifications
  async getNotificationsByUser(userId: number) {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new Error('User not Found!!');
    }

    return this.notifcationRepository.find({
      where: { user: { id: userId } },
      order: { id: 'DESC' },
    });
  }

  // Get company related notifiations for admins of companies and officers of the company
  async getCompanyRelatedNotifications(companyId: number) {
    const company = this.companyService.findCompany(companyId);

    if (!company) {
      throw new Error('Company not found');
    }
  }

  async sendNotificationToEmail(
    userId: number,
    subject: string,
    message: string,
  ): Promise<void> {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.email) {
      throw new Error('User not found or email not provided');
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: subject,
        text: message,
        html: `<p>${message}</p>`,
      });
      // implement send push notification
      // await this.sendNotification();
    } catch (error) {
      console.error('Error sending email notification', error);
      throw new Error('Failed to send email notification');
    }
  }

  async sendNotificationToPhone(
    userId: number,
    message: string,
  ): Promise<void> {
    const user = await this.usersService.findOneById(userId)
    if (!user || !user.phone) {
      throw new Error('User not found or phone number not provided');
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
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
