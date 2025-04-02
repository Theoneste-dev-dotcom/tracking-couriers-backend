import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Role } from "src/common/enums/role.enum";


export class AssignRoleDto{
    @IsEnum(Role)
    role: Role;

    @IsNumber()
    @IsOptional()
    companyId: number;

    @IsArray()
    @IsNumber({}, {each: true})
    companyIds: number[];
}