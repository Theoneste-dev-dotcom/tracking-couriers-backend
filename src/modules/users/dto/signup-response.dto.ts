import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class SignupResponseDto {
  @IsString()
  message: string;

  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  constructor(message:string, email: string, role: Role) {
    this.email = email;
    this.role = role;
  }
}
