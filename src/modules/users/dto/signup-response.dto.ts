import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class SignupResponseDto {
  message: string;
  email: string;
  role: Role;
  name:string;
  phone:string;
  company_id?:number; // optional
  
  constructor(message:string, email: string, role: Role, phone:string, name:string, companyId:number) {
    this.email = email;
    this.role = role;
    this.name = name;
    this.phone = phone;
    this.company_id = companyId;
  }
}
