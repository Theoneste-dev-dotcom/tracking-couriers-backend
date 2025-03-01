import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompaniesService } from 'src/modules/companies/companies.service';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private companyService: CompaniesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.get<SubscriptionPlan[]>(
      'subscription',
      context.getHandler(),
    );

    if (!requiredPlans) {
      return true; 
    }


    
    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    if (!user || !user.companyId) {
      throw new ForbiddenException('User is not associated with any company');
    }

    const company = await this.companyService.findCompany(user.companyId);

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    if (company.subscriptionPlan === SubscriptionPlan.EXPIRED) {
      throw new ForbiddenException(
        'Subscription expired. Please upgrade your plan.',
      );
    }

    if (company.subscriptionPlan) {
      if (!requiredPlans.includes(company.subscriptionPlan)) {
        throw new ForbiddenException(
          `Access restricted to ${requiredPlans.join(', ')} plans.`,
        );
      }
    }

    return true;
  }
}
