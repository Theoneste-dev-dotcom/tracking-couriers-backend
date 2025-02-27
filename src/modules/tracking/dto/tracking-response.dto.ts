import { IsNumber, IsString, IsObject } from 'class-validator';

export class TrackingResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  driverId: number;

  @IsString()
  locationPlaceName: string;

  @IsObject()
  currentLocation: { longitude: number; latitude: number };

  @IsString()
  status: string;

  @IsString()
  timestamp: Date;
}