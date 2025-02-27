import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsEnum(SubscriptionPlan, { message: 'Invalid subscription plan' })
  subscriptionPlan: SubscriptionPlan;

  @IsDate()
  subscriptionExpiry:Date;

}
