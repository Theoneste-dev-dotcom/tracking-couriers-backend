
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import { Company } from 'src/modules/companies/entities/company.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(()=> User)
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(()=> Company) 
  @JoinColumn({name: 'company_id'})
  company: Company

  @Column()
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  seen: boolean;

  @Column({nullable: true})
  relatedShipmentId?:number;

  @CreateDateColumn()
  createdAt:Date;
}


