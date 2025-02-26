import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class UserResponseDto {
  name: string;
  email: string;
  role: Role;
  phone: string;
  company_id: number;

  constructor(
    email: string,
    role: Role,
    phone: string,
    companyId: number,
    name: string,
  ) {
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.company_id = companyId;
    this.role = role;
  }
}
