export class UserResponseDto {
    id:number;
    name:string;
    email:string;
    role:string;
    phone?:string;
    companyId?:number;
    companyIds?:number[];
    ownedCompanyId?:number;

    constructor(
        id:number,
        name:string,
        email:string,
        role:string,
        phone?:string
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone
    }



}