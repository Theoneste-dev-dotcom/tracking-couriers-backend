import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { Package } from './packages/package.entity';
import { Notification } from './notifications/notification.entity';
import { DriversModule } from './drivers/drivers.module';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { ClientsModule } from './clients/clients.module';
import { PackagesModule } from './packages/packages.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Package, Notification],
        synchronize: true, // Set to false in production
      }),
    }),
    DriversModule,
    ClientsModule,
    PackagesModule,
    AuthModule,
    UsersModule,
    // Other modules
  ],
  providers: [NotificationsGateway],
})
export class AppModule {}