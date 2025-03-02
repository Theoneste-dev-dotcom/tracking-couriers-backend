import { forwardRef, Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { ShipmentsModule } from '../shipments/shipments.module';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([ShipmentUpdate]),
    forwardRef(()=> ShipmentsModule),
    CompaniesModule,
    NotificationsModule,
    ShipmentsModule,
    forwardRef(()=>UsersModule),
    forwardRef(()=> AuthModule)
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}