import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from 'src/common/enums/notitication-type.enum';


export class CreateNotificationDto {
  @IsNumber()
  userId: number;

  @IsString()
  type: NotificationType;

  @IsString()
  message: string;

  @IsBoolean()
  @IsOptional()
  seen?: boolean;

  @IsNumber()
  @IsOptional()
  relatedShipmentId?: number;
}