import { forwardRef, Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service'
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Shipment]),
    CompaniesModule,
    NotificationsModule,
    forwardRef(()=> UsersModule),
    forwardRef(()=> AuthModule)
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports:[ShipmentsService]
})
export class ShipmentsModule {}