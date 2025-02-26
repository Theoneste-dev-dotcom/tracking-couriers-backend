import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class LoginResponseDto {
  @IsString()
  message: string;
  
  @IsString()
  refreshToken:string

  @IsString()
  token:string

  constructor(message:string, token: string, refreshToken: string) {
    this.message = message
    this.token = token;
    this.refreshToken = refreshToken;
  }
}
