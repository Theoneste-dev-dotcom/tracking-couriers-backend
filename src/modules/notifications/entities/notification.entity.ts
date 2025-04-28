
import { NotificationType } from 'src/common/enums/notitication-type.enum';
import { Company } from 'src/modules/companies/entities/company.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { CompanyNotification } from './company-notification.entity';
import { UserNotification } from './user-notification.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: NotificationType;

  @Column()
  message: string;

  @OneToMany(() => UserNotification, (userNotification) => userNotification.notification)
  userNotifications: UserNotification[];

  @OneToMany(() => CompanyNotification, (companyNotification) => companyNotification.notification)
  companyNotifications: CompanyNotification[];


  @CreateDateColumn()
  createdAt:Date;
}


