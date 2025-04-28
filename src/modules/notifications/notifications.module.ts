import { forwardRef, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { UserEvents } from './events/user.events';
import { NotificationsService } from './notifServices.service';
import { NotificationsGateway } from './notification.gateway';
import { NotificationService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserNotification } from './entities/user-notification.entity';
import { CompanyNotification } from './entities/company-notification.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Notification, UserNotification, CompanyNotification]),
    CompaniesModule,
    forwardRef(()=>AuthModule),
    forwardRef(()=> UsersModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, UserEvents, NotificationsGateway, NotificationService, AuthGuard],
  exports: [NotificationsService, NotificationService, NotificationsGateway]
})
export class NotificationsModule {}