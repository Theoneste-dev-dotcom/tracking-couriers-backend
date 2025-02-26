import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompaniesService } from 'src/modules/companies/companies.service';

@Injectable()
export class SubscriptionExpiryJob {
  constructor(private readonly companyService:CompaniesService) {}

  @Cron('0 0 * * *') // Runs daily at midnight
  async handleSubscriptionExpiry() {
    console.log('Checking for expired subscriptions...');
    await this.companyService.expireSubscriptions();
    console.log('Expired subscriptions downgraded.');
  }
}
