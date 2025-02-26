import { IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UserResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  phone?: string; // Optional, as it may not always be provided

  @IsString()
  createdAt?: Date;

  @IsString()
  updatedAt?: Date;

  constructor(id: number, name: string, email: string, role: Role, phone?: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.phone = phone;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}