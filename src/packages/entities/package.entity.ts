import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Client } from 'src/clients/entities/client.entity';

@Entity()
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  destination: string;

  @Column()
  origin: string;

  @Column()
  status: 'CREATED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;
}