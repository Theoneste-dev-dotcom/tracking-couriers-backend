import { Company } from 'src/modules/companies/entities/company.entity';
import { ShipmentUpdate } from 'src/modules/tracking/entities/shipment-update.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ShipmentUpdate, { nullable: true })
  @JoinColumn({ name: 'shipment_update_id' })
  shipmentUpdate: ShipmentUpdate;

  @Column()
  senderId?: number;

  @Column( 'json', {name: 'sender_details'})
  senderDetails?:{
    name:string;
    email:string;
    phone:number;
    location_name:string;
  }

  @Column()
  receiverId?: number;

  @Column('json', {name:'receiver_details'})
  receiverDetails?:  {
    name:string,
    phone:number,
    email:string;
    location_name:string;
  }

  @ManyToOne(() => Company, (company) => company.shipments)
  @JoinColumn({name: 'company_id'})
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
