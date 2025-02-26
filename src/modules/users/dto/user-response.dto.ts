import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
export class UserResponseDto {
 @IsString()
 email:string

 @IsString()
 role:Role

 constructor(email:string, role:Role) {
    this.email = email
    this.role = role
 }
}
