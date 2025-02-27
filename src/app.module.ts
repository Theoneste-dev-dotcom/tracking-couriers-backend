import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ShipmentsModule } from './modules/shipments/shipments.module'
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TypeOrmModule, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { CronModule } from './cron-jobs/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forRoot({
        isGlobal:true,
      })],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], 
        synchronize: true, 
        logging: configService.get<boolean>('LOGGING', true), 
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    ShipmentsModule,
    TrackingModule,
    NotificationsModule,
    CronModule
  ],

  controllers:[AppController],
  

})
export class AppModule {}