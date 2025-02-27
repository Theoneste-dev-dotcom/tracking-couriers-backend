import { IsNotEmpty, IsNumber, IsString, IsObject } from 'class-validator';

export class CreateShipmentDto {
  @IsNotEmpty()
  @IsString()
  trackingNumber: string;

  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @IsNotEmpty()
  @IsNumber()
  companyId: number; // Assuming you want to associate the shipment with a company

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsObject()
  origin: { longitude: number; latitude: number; placeName: string };

  @IsNotEmpty()
  @IsObject()
  destination: { longitude: number; latitude: number; placeName: string };
}