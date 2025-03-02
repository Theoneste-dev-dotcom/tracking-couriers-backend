import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { Role } from 'src/common/enums/role.enum';
import { Subscription } from './subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,

    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const subscription = this.subscriptionRepository.create(
      createSubscriptionDto,
    );
    return this.subscriptionRepository.save(subscription);
  }

  async getCompanySubscription(companyId: number) {
    return this.subscriptionRepository.findOne({
      where: { company: { id: companyId } },
      order: { expiryDate: 'DESC' },
    });
  }

  async updateSubscription(
    companyId: number,
    plan: SubscriptionPlan,
    durationDays: number,
  ) {
    const subscription = await this.getCompanySubscription(companyId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    subscription.plan = plan;
    subscription.startDate = new Date();
    subscription.expiryDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    ); // Add days

    return this.subscriptionRepository.save(subscription);
  }

  async checkSubscription(companyId: number): Promise<boolean | null> {
    const subscription = await this.getCompanySubscription(companyId);
    return subscription && subscription.expiryDate > new Date();
  }

  async isSubscriptionValid(company: Company): Promise<boolean> {
    if (!company.subscriptionExpiry) {
      return true; // No expiration date, always valid
    }
    return company.subscriptionExpiry > new Date();
  }

  async getUserWithCompany(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['companies'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async checkShipmentLimit(companyId: number): Promise<boolean> {
    const company = await this.companyRepository.findOneBy({ id: companyId });
    if (!company) {
      return false;
    }

    const shipmentCount = await this.shipmentRepository.countBy({
      company: { id: companyId },
    });

    switch (company.subscriptionPlan) {
      case SubscriptionPlan.FREE_TRIAL:
        return shipmentCount < 10;
      case SubscriptionPlan.BASIC:
        const today = new Date();
        const shipmentsToday = await this.shipmentRepository
          .createQueryBuilder('shipment')
          .where('shipment.companyId = :companyId', { companyId })
          .andWhere('DATE(shipment.createdAt) = DATE(:today)', { today })
          .getCount();
        return shipmentsToday < 60;
      case SubscriptionPlan.PREMIUM:
        return true; // Unlimited shipments
      default:
        return false;
    }
  }

  async checkDriverLimit(companyId: number): Promise<boolean> {
    const company = await this.companyRepository.findOneBy({ id: companyId });
    if (!company) {
      return false;
    }
    const drivers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.companies', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('user.role = :role', { role: Role.DRIVER })
      .getCount();

    switch (company.subscriptionPlan) {
      case SubscriptionPlan.FREE_TRIAL:
        return drivers < 10;
      case SubscriptionPlan.BASIC:
        return drivers < 30;
      case SubscriptionPlan.PREMIUM:
        return true; // Unlimited drivers
      default:
        return false;
    }
  }
}
