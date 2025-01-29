import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Status } from '../enums/status.enum';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsString()
  destination: string;

  @IsString()
  origin: string;

  @IsEnum(Status)
  status:Status;

  @Transform(({ value }) => new Date(value))
  timestamp: Date;

  @IsUUID()
  clientId: number;

  @IsUUID()
  @IsOptional()
  driverId?: string;
}
