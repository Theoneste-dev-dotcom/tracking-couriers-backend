import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import { UserService } from '../users/users.service';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { ShipmentsService } from '../shipments/shipments.service';
import { Shipment } from '../shipments/entities/shipment.entity';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(ShipmentUpdate)
    private readonly trackingRepository: Repository<ShipmentUpdate>,

    private notificationsService: NotificationsService,
    private userService: UserService,
    private shipmentService: ShipmentsService,
  ) {}

  async create(
    createShipmentUpdateDto: CreateTrackingDto,
  ): Promise<ShipmentUpdate> {
    const shipmentUpdate = this.trackingRepository.create(
      createShipmentUpdateDto,
    );
    return this.trackingRepository.save(shipmentUpdate);
  }

  // encourage the receiver and sender to be registered for receiving the updates about the shipment
  async updateLocation(createTrackingDto: UpdateTrackingDto) {
    // check the drivers subscription and update the related users, and companies

    const trackingUpdate = this.trackingRepository.create(createTrackingDto);
    if (!createTrackingDto.driverId) {
      return null;
    }
    const driver = this.userService.findUser(createTrackingDto.driverId);
    const companies = this.userService.getUserCompanies(
      createTrackingDto.driverId,
    );

    if (!createTrackingDto.shipmentId) {
      ("return you haven't specified the shipment id");
    } else {
      const shipment: Shipment = await this.shipmentService.findOne(
        createTrackingDto.shipmentId,
      );
      if (shipment.senderId && shipment.receiverId) {
        const sender = this.userService.findUser(shipment.senderId);
        const receier = this.userService.findUser(shipment.receiverId);

        const users = [sender, receier, driver];
        switch (companies[0].subscriptionPlan) {
          case SubscriptionPlan.PREMIUM:
            await this.sendNotifications(
              createTrackingDto,
              users,
              companies[0],
              ['EMAIL', 'SMS', 'PUSH'],
            );
            break;

          case SubscriptionPlan.BASIC:
            await this.sendNotifications(
              createTrackingDto,
              users,
              companies[0],
              ['EMAIL', 'PUSH'],
            );
            break;

          case SubscriptionPlan.FREE_TRIAL:
            await this.sendNotifications(
              createTrackingDto,
              users,
              companies[0],
              ['PUSH'],
            );
            break;
        }

        // send notifications to the sender, send notification to the receiver
      }
    }

    return await this.trackingRepository.save(trackingUpdate);
  }

  async getShipmentUpdates(shipmentId: number) {
    return await this.trackingRepository.findOne({
      where: { id: shipmentId },
    });
  }

  async findAll(): Promise<ShipmentUpdate[]> {
    return this.trackingRepository.find();
  }

  async findOne(id: number): Promise<ShipmentUpdate> {
    const shipmentUpdate = await this.trackingRepository.findOneBy({ id });
    if (!shipmentUpdate) {
      throw new NotFoundException(`ShipmentUpdate with ID ${id} not found`);
    }
    return shipmentUpdate;
  }

  async update(
    id: number,
    updateShipmentUpdateDto: UpdateTrackingDto,
  ): Promise<ShipmentUpdate> {
    await this.trackingRepository.update(id, updateShipmentUpdateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.trackingRepository.delete(id);
  }

  private async sendNotifications(
    shipmentDto: UpdateTrackingDto,
    users,
    company: Company,
    notificationTypes: string[],
  ) {
    const message = `The shipment has been updated   by ${users[2].name} in ${company.name}.`;

    for (let i = 0; i < 2; i++) {
      if (shipmentDto.shipmentId) {
        // userId:number, companyId:number, type:NotificationType, message:string, seen:false, related_id:number
        const notification: CreateNotificationDto = new CreateNotificationDto(
          users[i].id,
          company.id,
          NotificationType.SHIPMENT,
          message,
          shipmentDto.shipmentId,
        );

        // Send notifications based on the plan
        if (notificationTypes.includes('EMAIL')) {
          await this.notificationsService.sendNotificationToEmail(notification);
        }
        if (notificationTypes.includes('SMS')) {
          await this.notificationsService.sendNotificationToPhone(notification);
        }
        if (notificationTypes.includes('PUSH')) {
          await this.notificationsService.sendNotification(notification);
        }
      } else {
        if (shipmentDto.shipmentId) {
            // userId:number, companyId:number, type:NotificationType, message:string, seen:false, related_id:number

            // using notification type of company will be the notification to be fetched by related admins, and officers
          const notification: CreateNotificationDto = new CreateNotificationDto(
            users[i].id,
            company.id,
            NotificationType.COMPANY,
            message,
            shipmentDto.shipmentId,
          );

          // Send notifications based on the plan
          if (notificationTypes.includes('EMAIL')) {
            await this.notificationsService.sendNotificationToEmail(
              notification,
            );
          }
          if (notificationTypes.includes('SMS')) {
            await this.notificationsService.sendNotificationToPhone(
              notification,
            );
          }
          if (notificationTypes.includes('PUSH')) {
            await this.notificationsService.sendNotification(notification);
          }
        }
      }
    }
  }
}
