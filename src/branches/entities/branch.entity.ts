import { Company } from "src/modules/companies/entities/company.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @ManyToOne(()=> Company, (company)=> company.branches, {cascade:true, onDelete:'CASCADE'})
    @JoinColumn({name:"company_id"})
    company:Company
}
