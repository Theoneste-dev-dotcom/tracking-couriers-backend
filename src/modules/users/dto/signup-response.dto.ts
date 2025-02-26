import { IsEmail, IsEnum } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';


export class SignupResponseDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  constructor(email: string, role: Role) {
    this.email = email;
    this.role = role;
  }
}