import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class DriverUpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsPhoneNumber()
    @IsOptional()
    phone?: string;
}