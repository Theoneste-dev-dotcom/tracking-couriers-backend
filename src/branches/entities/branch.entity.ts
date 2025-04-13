import { Company } from "src/modules/companies/entities/company.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('branches')
export class Branch {
    @PrimaryGeneratedColumn()
    id:number

    @Column({nullable:false})
    name:string

    @Column({nullable:false})
    location:string

    @Column({nullable:true})
    phone_number?:string
    
    @Column({nullable:false})
    manager_name:string

    @Column({nullable:true})
    email?:string

    @ManyToOne(()=> Company, (company)=> company.branches)
    company:Company
}
