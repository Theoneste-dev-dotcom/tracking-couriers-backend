import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { NotificationService } from '../notifications/notifications.service';
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

    private notificationsService: NotificationService,
    private userService: UserService,
    private shipmentService: ShipmentsService,
  ) {}

  // on frontend we will add a button for stargin track for creating a tracking entity, that we will notify him whenever the location is updated

  async create(
    createShipmentUpdateDto: CreateTrackingDto,
  ): Promise<ShipmentUpdate> {
    const shipmentUpdate = this.trackingRepository.create(
      createShipmentUpdateDto,
    );
    return this.trackingRepository.save(shipmentUpdate);
  }

  // encourage the receiver and sender to be registered for receiving the updates about the shipment
  // this will be made whenever the the drivers scans for the shipment
  async updateLocation(createTrackingDto: UpdateTrackingDto) {
    // check the drivers subscription and update the related users, and companies

    const trackingUpdate = this.trackingRepository.create(createTrackingDto);
    if (!createTrackingDto.driverId) {
      return null;
    }
    const driver = this.userService.findUser(createTrackingDto.driverId);


    const company_result = await this.userService.getAssociatedCompany(
      createTrackingDto.driverId, (await driver).role
    );


    if(!company_result || Array.isArray(company_result)){
      throw new Error("driver is not associated with valid company")
    }

    const driver_company = company_result
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
        // switch (driver_company.subscriptionPlan) {
        //   case SubscriptionPlan.PREMIUM:
        //     await this.sendNotifications(
        //       createTrackingDto,
        //       users,
        //       driver_company,
        //       ['EMAIL', 'SMS', 'PUSH'],
        //     );
        //     break;

        //   case SubscriptionPlan.BASIC:
        //     await this.sendNotifications(
        //       createTrackingDto,
        //       users,
        //       driver_company,
        //       ['EMAIL', 'PUSH'],
        //     );
        //     break;

        //   case SubscriptionPlan.FREE_TRIAL:
        //     await this.sendNotifications(
        //       createTrackingDto,
        //       users,
        //       driver_company,
        //       ['PUSH'],
        //     );
        //     break;
        // }

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
          // await this.notificationsService.sendNotification(notification);
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
            // await this.notificationsService.sendNotification(notification);
          }
        }
      }
    }
  }
}
