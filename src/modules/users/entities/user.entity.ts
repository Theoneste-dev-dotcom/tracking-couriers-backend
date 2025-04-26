import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { Driver } from './driver.entity';
import { CompanyOwner } from './company_owner.entity';
import { Officer } from './officers.entity';
import { Admin } from './admins.entity';
import { Client } from './client.entity';

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

  @Column({ nullable: true })
  phone?: string;
  
  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  about?: string;

  @OneToOne(() => CompanyOwner, (ow) => ow.user)
  owner: CompanyOwner;

  @OneToMany(() => Driver, (driver) => driver.user)
  driver: Driver;

  @OneToMany(() => Officer, (officer) => officer.user)
  officer: Officer;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin: Admin;

  @OneToOne(() => Client, (client) => client.user)
  client: Client;

  @Column({ nullable: true })
  profilePic?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsString()
  refreshToken?: string;
}
