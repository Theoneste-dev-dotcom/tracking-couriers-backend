// notifications/entities/user-notification.entity.ts

import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('user-notifications')
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @ManyToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
