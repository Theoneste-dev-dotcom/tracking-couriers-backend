import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, (company) => company.subscriptionPlan, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE_TRIAL })
  plan: SubscriptionPlan;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
