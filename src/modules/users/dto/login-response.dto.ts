import { IsEmail, IsEnum, IsString, IsNumber } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class LoginResponseDto {
  @IsString()
  message: string;

  @IsString()
  refreshToken: string;

  @IsString()
  token: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsNumber()
  code: number;

  constructor(code:number, message: string, token: string, refreshToken: string, name: string, email: string, role: Role) {
    this.code = code
    this.message = message;
    this.token = token;
    this.refreshToken = refreshToken;
    this.name = name;
    this.email = email;
    this.role = role;
  }
}