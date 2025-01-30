import { IsEmail, IsString, MinLength } from "class-validator";
import { Role } from "../enums/role.enum";

export class CreateUserDto {
    @IsEmail()
    email: string;
  
    @IsString()
    password: string;
  
    @MinLength(4)
    username: string;
  
    @IsString()
    role:Role;
  }
  