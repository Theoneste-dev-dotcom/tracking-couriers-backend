import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from 'src/common/enums/notitication-type.enum';


export class CreateNotificationDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  companyId:number;

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

  constructor(userId:number, companyId:number, type:NotificationType, message:string, related_id:number ) {
    this.userId = userId;
    this.companyId = companyId;
    this.type = type;
    this.message = message;
    this.seen = false;
    this.relatedShipmentId = related_id;
  }
}