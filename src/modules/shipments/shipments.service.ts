import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UserService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { NotificationService } from '../notifications/notifications.service';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import moment from 'moment';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,

    private readonly userService: UserService,
    private readonly companyService: CompaniesService,
    private readonly notificationsService: NotificationService,
  ) {}

  // this acan be created by admin, officer,
  // it can also be created by user/client  requesting for the service/(this request can be replied by the officer)
  async create(
    createShipmentDto: CreateShipmentDto,
    userId: number,
    companyId: number,
  ) {
    const shipment = this.shipmentRepository.create(createShipmentDto);
    const user = await this.userService.findUser(userId);
    const company = await this.companyService.findCompany(companyId);

    const canCreateShipment = await this.checkShipmentLimit(company);
    if (!canCreateShipment) {
      throw new ForbiddenException(`Daily shipment limit exceeded for ${company.subscriptionPlan} plan.`);
    }
    

    if (!user) {
      // throw exception that you are not authorized
      throw new UnauthorizedException(
        "please register your self, We don't have user with taht id",
      );
    }


    if (!company) {
      throw new Error(
        "Please we don't have company with this id " +
          companyId +
          ' please can you try to switch the companies',
      );
    }

    if (user.role == Role.CLIENT) {
      const message = `User ${user.name} Requested service to driver his ${shipment.name}`
      // create the shipment and send notification to the related company, if their subscription has ended give hime alert that , you are requesting the service to the expired premium bank
      if (company.subscriptionPlan === SubscriptionPlan.EXPIRED) {
        throw new Error(
          'You are requesting the service from a company with an expired subscription. Please contact the company to renew their plan.',
        );
      }

      const notification:CreateNotificationDto = new CreateNotificationDto(user.id, company.id, NotificationType.SHIPMENT, message, shipment.id)

      switch (company.subscriptionPlan) {
        case SubscriptionPlan.PREMIUM:
          await this.sendNotifications(shipment, user, company, [
            'EMAIL',
            'SMS',
            'PUSH',
          ], message);
          break;

        case SubscriptionPlan.BASIC:
          await this.sendNotifications(shipment, user, company, [
            'EMAIL',
            'PUSH',
          ], message);
          break;

        case SubscriptionPlan.FREE_TRIAL:
          await this.sendNotifications(shipment, user, company, [
            'PUSH',
          ], message);
          break;
      }
    } else if (
      user.role == Role.ADMIN ||
      user.role == Role.OFFICER ||
      user.role == Role.DRIVER
    ) {
      const message = `A new shipment has been created by ${user.name} in ${company.name}.`;
    
      switch (company.subscriptionPlan) {
        case SubscriptionPlan.EXPIRED:
          throw new Error(
            'Subscription expired. Upgrade your plan to create shipments.',
          );

        case SubscriptionPlan.PREMIUM:
          await this.sendNotifications(shipment, user, company, [
            'EMAIL',
            'SMS',
            'PUSH',
          ], message);
          break;

        case SubscriptionPlan.BASIC:
          await this.sendNotifications(shipment, user, company, [
            'EMAIL',
            'PUSH',
          ], message);
          break;

        case SubscriptionPlan.FREE_TRIAL:
          await this.sendNotifications(shipment, user, company, [
            'PUSH',
          ], message);
          break;
      }
    } else {
      throw new UnauthorizedException(
        "Please try to get authorized because you can't create package unless",
      );
    }

    return await this.shipmentRepository.save(shipment);
  }

  async findAll() {
    return await this.shipmentRepository.find();
  }

  async findOne(id: number):Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if(!shipment) {
      throw new Error("Failed to get the related shipment")
    }
    return shipment
  }

  async update(id: number, updateShipmentDto: UpdateShipmentDto) {
    await this.shipmentRepository.update(id, updateShipmentDto);
    return await this.findOne(id);
  }

  async remove(id: number) {
    return await this.shipmentRepository.delete(id);
  }

  async findShipmentsByCompany(companyId: number): Promise<Shipment[]> {
    return this.shipmentRepository.findBy({ company: { id: companyId } });
  }

  async findShipmentsByClientId(clientId: number): Promise<Shipment[]> {
    return this.shipmentRepository.findBy({ user: { id: clientId } });
  }

  async getShipmentReceiverOrSender(userId:number){
    const receiver = this.userService.findUser(userId)
    if(!receiver){
      return "Your haven't specified the receiver of the shipment |  or the receiver isn't registered within our  system"
    }
    return receiver;
   
  }

  private async sendNotifications(
    shipmentDto: Shipment,
    user: User,
    company: Company,
    notificationTypes: string[],
    message:string
  ) {
 
    
      const notification: CreateNotificationDto = new CreateNotificationDto(
          user.id,
          company.id,
          NotificationType.SHIPMENT,
          message,
          shipmentDto.id,
        ); 

    // Send notifications based on the plan
    if (notificationTypes.includes('EMAIL')) {
      await this.notificationsService.sendNotificationToEmail(
       notification
      );
    }
    if (notificationTypes.includes('SMS')) {
      await this.notificationsService.sendNotificationToPhone(notification);
    }
    // send push notification
    if (notificationTypes.includes('PUSH')) {
      // await this.notificationsService.sendNotification(notification);
    }
  }



  private async checkShipmentLimit(company: Company): Promise<boolean> {
    const today = moment().startOf('day').toDate(); // Get the start of the day
    const shipmentCount = await this.shipmentRepository.count({
      where: { company: { id: company.id }, createdAt: MoreThanOrEqual(today) },
    });

    const shipmentLimits = {
      [SubscriptionPlan.FREE_TRIAL]: 10,
      [SubscriptionPlan.BASIC]: 60,
      [SubscriptionPlan.PREMIUM]: Infinity, // Unlimited
    };

    return shipmentCount < shipmentLimits[company.subscriptionPlan];
  }



  //  to be used later

  private getNotificationTypes(plan: SubscriptionPlan): string[] {
    switch (plan) {
      case SubscriptionPlan.PREMIUM:
        return ['EMAIL', 'SMS', 'PUSH'];
      case SubscriptionPlan.BASIC:
        return ['EMAIL', 'PUSH'];
      case SubscriptionPlan.FREE_TRIAL:
        return ['PUSH'];
      default:
        return [];
    }
  }
}


