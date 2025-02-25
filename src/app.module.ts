import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ShipmentsModule } from './modules/shipments/shipments.module'
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CompaniesModule,
    ShipmentsModule,
    TrackingModule,
    NotificationsModule,
  ],
})
export class AppModule {}