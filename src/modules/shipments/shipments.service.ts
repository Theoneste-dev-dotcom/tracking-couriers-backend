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
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import moment from 'moment';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,

    private readonly userService: UserService,
    private readonly companyService: CompaniesService,
    private readonly notificationsService: NotificationsService,
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
      // create the shipment and send notification to the related company, if their subscription has ended give hime alert that , you are requesting the service to the expired premium bank
      if (company.subscriptionPlan === SubscriptionPlan.EXPIRED) {
        throw new Error(
          'You are requesting the service from a company with an expired subscription. Please contact the company to renew their plan.',
        );
      }

      switch (company.subscriptionPlan) {
        case SubscriptionPlan.PREMIUM:
          await this.sendNotifications(createShipmentDto, user, company, [
            'EMAIL',
            'SMS',
            'PUSH',
          ]);
          break;

        case SubscriptionPlan.BASIC:
          await this.sendNotifications(createShipmentDto, user, company, [
            'EMAIL',
            'PUSH',
          ]);
          break;

        case SubscriptionPlan.FREE_TRIAL:
          await this.sendNotifications(createShipmentDto, user, company, [
            'PUSH',
          ]);
          break;
      }
    } else if (
      user.role == Role.ADMIN ||
      user.role == Role.OFFICER ||
      user.role == Role.DRIVER
    ) {
      switch (company.subscriptionPlan) {
        case SubscriptionPlan.EXPIRED:
          throw new Error(
            'Subscription expired. Upgrade your plan to create shipments.',
          );

        case SubscriptionPlan.PREMIUM:
          await this.sendNotifications(createShipmentDto, user, company, [
            'EMAIL',
            'SMS',
            'PUSH',
          ]);
          break;

        case SubscriptionPlan.BASIC:
          await this.sendNotifications(createShipmentDto, user, company, [
            'EMAIL',
            'PUSH',
          ]);
          break;

        case SubscriptionPlan.FREE_TRIAL:
          await this.sendNotifications(createShipmentDto, user, company, [
            'PUSH',
          ]);
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

  async findOne(id: number) {
    return await this.shipmentRepository.findOne({ where: { id } });
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

  private async sendNotifications(
    shipmentDto: CreateShipmentDto,
    user: User,
    company: Company,
    notificationTypes: string[],
  ) {
    const message = `A new shipment has been created by ${user.name} in ${company.name}.`;

    // Send notifications based on the plan
    if (notificationTypes.includes('EMAIL')) {
      await this.notificationsService.sendNotificationToEmail(
        user.id,
        'Shipment Created',
        message,
      );
    }
    if (notificationTypes.includes('SMS')) {
      await this.notificationsService.sendNotificationToPhone(user.id, message);
    }
    if (notificationTypes.includes('PUSH')) {
      await this.notificationsService.sendNotification({
        userId: user.id,
        message: message,
        type: NotificationType.SHIPMENT,
      });
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


