import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('officers')
export class Officer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.officers,{
    cascade:true,
    onDelete:'CASCADE'
  })
  @JoinColumn({name:'company_id'})
  officerInCompany: Company;

  @OneToOne(()=> User,{cascade:true ,onDelete:'CASCADE'})
  @JoinColumn({name:'user_id'})
  user:User;
}
