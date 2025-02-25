import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ShipmentsModule } from './modules/shipments/shipments.module'
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';

const db_port = parseInt(process.env.DB_PORT || "5432")

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'theo123',
        database: 'couriers_system',
        entities: [], 
        synchronize: false,
        logging: true,
    

    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    ShipmentsModule,
    TrackingModule,
    NotificationsModule,
  ],

  controllers:[AppController],
  

})
export class AppModule {}