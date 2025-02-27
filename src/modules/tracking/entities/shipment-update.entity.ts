
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Shipment } from 'src/modules/shipments/entities/shipment.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity()
export class ShipmentUpdate {

  @PrimaryGeneratedColumn()
  shipment_id: number;
  
  //relationship between the shipment and shipment update
  @OneToOne(() => Shipment, (shipment) => shipment.shipmentUpdate) 
  shipment: Shipment; 

  // relationship between the driver and the uesr
  @ManyToOne(() => User, { nullable: true }) 
  @JoinColumn({ name: 'driverId' }) 
  driver: User; 


  @Column()
  locationPlaceName: string;

  @Column('json')
  currentLocation: { longitude: number; latitude: number };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column()
  status: string;
}

