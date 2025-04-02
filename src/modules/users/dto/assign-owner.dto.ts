import { IsInt } from "class-validator";

export class AssignOwner {
    @IsInt()    
    userId: number;
}