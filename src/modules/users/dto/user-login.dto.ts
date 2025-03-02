import { IsString, MinLength } from "class-validator";

export class UserLoginDto {
    @IsString()
    email:string;

    @IsString()
    @MinLength(6)
    password:string;
}