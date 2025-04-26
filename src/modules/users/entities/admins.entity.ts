import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.admin, {cascade:true, onDelete: 'CASCADE'})
  @JoinColumn({name:"company_id"})
  adminInCompany: Company;

  @OneToOne(() => User, {cascade:true, onDelete: 'CASCADE'})
  @JoinColumn({name:"user_id"})
  user: User;
}
