import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class LoginResponseDto {
  message: string;
  refreshToken:string;
  token:string;
  name:string;
  email:string;
  role:Role;
  constructor(message:string, token: string, refreshToken: string) {
    this.message = message
    this.token = token;
    this.refreshToken = refreshToken;
  }
}
