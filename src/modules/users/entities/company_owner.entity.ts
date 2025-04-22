import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PartialUser } from './PartialUser.entity';
import { User } from './user.entity';

@Entity('company_owners')
export class CompanyOwner {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Company, (company) => company.owner)
  @JoinColumn()
  ownedCompany: Company;

  @ManyToOne(()=> User, (user)=> user.owners )
  user: User;
}
