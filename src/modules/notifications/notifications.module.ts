import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Notification]),
    AuthModule, 
    CompaniesModule,
    UsersModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}