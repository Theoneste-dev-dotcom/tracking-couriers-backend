import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";

export class CreateTrackingDto {
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @IsNotEmpty()
  @IsString()
  locationPlaceName: string;

  @IsNotEmpty()
  @IsObject()
  currentLocation: { longitude: number; latitude: number };

  @IsNotEmpty()
  @IsString()
  status: string;

  
  @IsNotEmpty()
  @IsNumber()
  shipmentId: number; 
}