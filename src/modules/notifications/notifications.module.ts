import { forwardRef, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { UserEvents } from './events/user.events';
import { NotificationGateway } from './gateways/notifications.gateway';
import { NotificationsService } from './notifServices.service';
import { NotificationsGateway } from './notification.gateway';
import { NotificationService } from './notifications.service';

@Module({
  imports:[
    TypeOrmModule.forFeature([Notification]),
    CompaniesModule,
    forwardRef(()=>AuthModule),
    forwardRef(()=> UsersModule),
  
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, UserEvents, NotificationsGateway, NotificationService],
  exports: [NotificationsService, NotificationService]
})
export class NotificationsModule {}