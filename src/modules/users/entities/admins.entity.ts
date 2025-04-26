import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.admin)
  adminInCompany: Company;

  @ManyToOne(() => User,{cascade:true, onDelete: 'CASCADE'})
  @JoinColumn({name:"user_id"})
  user: User;
}
