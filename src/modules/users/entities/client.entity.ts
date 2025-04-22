import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Company, (company) => company.clients, { nullable: true })
  @JoinTable({
    name: 'company_clients', // Name of the join table
    joinColumn: {
      name: 'client_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'company_id',
      referencedColumnName: 'id',
    },
  })
  clientOfCompanies: Company[];

  @ManyToOne(()=> User, (user)=> user.clients)
  user:User;
}
