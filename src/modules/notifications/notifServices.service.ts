// notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UserService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import { NotificationsGateway } from './notification.gateway';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly companyService: CompaniesService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsGateway: NotificationsGateway  ) {}

  async createAndSendNotification(
    companyId: number,
    type: NotificationType,
    message: string
  ) {
    // Save to database
    const notification = await this.notificationRepo.save({
      company: { id: companyId },
      type,
      message
    });

    // Get recipients (admins, officers, drivers)
    const recipients = await this.userService.getCompanyMembers(companyId, [
      Role.ADMIN,
      Role.OFFICER,
      Role.DRIVER
    ]);

  
    // Send via WebSocket
    recipients.forEach(user => {
      this.notificationsGateway.sendToUser( notification, user?.id);
    });

    return notification;
  }

  async handleUserEvent(userId: number, action: 'created' | 'updated' | 'deleted') {
    const user = await this.userService.findOneById(userId);
    const company = await this.companyService.getUserCompany(user);
    
    if (!company) return;

    const message = `User ${user.name} has been ${action} successfully`;
    return this.createAndSendNotification(
      company.id,
      NotificationType.USER,
      message
    );
  }

  // Add other event handlers similarly
}