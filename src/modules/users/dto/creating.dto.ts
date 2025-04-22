import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}

export class CreateDriverDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  // Add companyId or other company association fields if needed
  @Type(() => Number)
  companyId?: number;
}

export class CreateOfficerDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  companyId?: number;
}

export class CreateAdminDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class AssignOwner {
  @IsInt()
  userId: number;
}

export class PartialOwnerDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  role: Role;

  @IsOptional()
  phone?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
