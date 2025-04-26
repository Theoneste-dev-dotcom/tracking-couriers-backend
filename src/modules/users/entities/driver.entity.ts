import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable:false})
  vehicleId:string;

  @ManyToOne(() => Company, (company) => company.drivers)
  @JoinTable()
  driverInCompany: Company;

  @OneToOne(()=> User,{cascade:true, onDelete: 'CASCADE'} )
  @JoinColumn({name:"user_id"})
  user: User;
}
