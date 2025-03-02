import { forwardRef, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { NotificationGateway } from './gateways/notifications.gateway';

@Module({
  imports:[
    TypeOrmModule.forFeature([Notification]),
    CompaniesModule,
    forwardRef(()=>AuthModule),
    forwardRef(()=> UsersModule),
  
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway],
  exports: [NotificationsService]
})
export class NotificationsModule {}