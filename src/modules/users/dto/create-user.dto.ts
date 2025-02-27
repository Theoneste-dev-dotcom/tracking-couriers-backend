import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsOptional() // Phone is optional
  @IsString()
  phone?: string;

  @IsArray()
  companies?:number[]


}