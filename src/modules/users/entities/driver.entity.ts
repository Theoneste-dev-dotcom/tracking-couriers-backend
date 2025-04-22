import { Company } from 'src/modules/companies/entities/company.entity';
import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @ManyToOne(()=> User, (user)=> user.drivers )
  user: User;
}
