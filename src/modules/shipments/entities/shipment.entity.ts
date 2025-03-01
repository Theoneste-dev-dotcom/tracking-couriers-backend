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

interface LocationType {
  longitude: number;
  latitude: number;
  placeName: string;
}
interface UserDetails {
  name: string;
  email: string;
  phone: number;
  location_name: string;
}
@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ShipmentUpdate, { nullable: true })
  @JoinColumn({ name: 'shipment_update_id' })
  shipmentUpdate: ShipmentUpdate;

  @ManyToOne(()=> User)
  @JoinColumn({name:"user_id"})
  user? : User

  @Column()
  senderId?: number;

  @Column('json', { name: 'sender_details' })
  senderDetails?:UserDetails

  @Column({nullable: true})
  receiverId?: number;

  @Column('json', { name: 'receiver_details' })
  receiverDetails?: UserDetails

  @ManyToOne(() => Company, (company) => company.shipments)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  status: string;

  @Column('json')
  origin: LocationType;

  @Column('json')
  destination: LocationType;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ nullable: true })
  weight?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
