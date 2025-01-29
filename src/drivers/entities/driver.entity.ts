// src/drivers/driver.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Package } from 'src/packages/entities/package.entity';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  address: string;

  @OneToMany(() => Package, (pkg) => pkg.driver)
  packages: Package[];
}