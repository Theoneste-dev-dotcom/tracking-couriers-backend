import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Notification } from './notification.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('company-notifications')
export class CompanyNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @ManyToOne(() => Company, (company) => company.notifications, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}