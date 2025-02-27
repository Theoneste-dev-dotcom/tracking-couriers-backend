import { Company } from "src/modules/companies/entities/company.entity";
import { ShipmentUpdate } from "src/modules/tracking/entities/shipment-update.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

 
  @OneToOne(() => ShipmentUpdate, { nullable: true }) 
  @JoinColumn() 
  shipmentUpdate: ShipmentUpdate; 


  @Column()
  senderId: number;

  @Column()
  receiverId: number;

  @ManyToOne(() => Company, (company) => company.shipments)
  company: Company;

  @Column()
  status: string;

  @Column('json')
  origin: { longitude: number; latitude: number; placeName: string };

  @Column('json')
  destination: { longitude: number; latitude: number; placeName: string };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}