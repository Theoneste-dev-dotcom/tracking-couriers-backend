import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  address: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan?: SubscriptionPlan;
  
  @OneToMany(() => User, (user)=> user.companies)
  users?:User[]

  @CreateDateColumn({default: Date.now()})
  createdAt: Date;

  @UpdateDateColumn({default: Date.now()})
  updatedAt: Date;
}
