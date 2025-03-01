
import { IsEnum, IsDate } from 'class-validator';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsDate()
  startDate: Date;

  @IsDate()
  expiryDate: Date;
}
