import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export const Subscription = (...plans:SubscriptionPlan[])=> SetMetadata('subscription', plans)