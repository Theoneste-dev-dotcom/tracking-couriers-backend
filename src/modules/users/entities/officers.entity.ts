import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('officers')
export class Officer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.officers)
  officerInCompany: Company;

  @OneToOne(()=> User,{onDelete:'CASCADE'})
  user:User;
}
