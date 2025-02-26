import { IsEmail, IsEnum, IsString, IsNumber } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class SignupResponseDto {
  @IsString()
  message: string;

  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  phone?: string; 

  constructor(message: string, id: number, name: string, email: string, role: Role, phone?: string) {
    this.message = message;
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.phone = phone;
  }
}