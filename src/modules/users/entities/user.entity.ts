import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: Role;

  @Column( {nullable: true})
  phone?: string;

  @ManyToMany(() => Company, (company) => company.clients, {nullable: true})
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

  @ManyToOne(()=> Company, company=> company.officers)
  officerInCompany?: Company;

  @ManyToOne(()=> Company, company=> company.drivers)
  driverInCompany?: Company;

  @OneToOne(()=> Company, (company)=> company.owner)
  ownedCompany?: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsString()
  refreshToken?:string;
}
