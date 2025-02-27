import { IsNumber, IsString, IsObject } from 'class-validator';

export class ShipmentResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  trackingNumber: string;

  @IsNumber()
  senderId: number;

  @IsNumber()
  receiverId: number;

  @IsNumber()
  driverId: number;

  @IsNumber()
  companyId: number; // Assuming you want to include the company ID in the response

  @IsString()
  status: string;

  @IsObject()
  origin: { longitude: number; latitude: number; placeName: string };

  @IsObject()
  destination: { longitude: number; latitude: number; placeName: string };

  @IsString()
  createdAt: Date; // You can also use a string if you want to format the date
}