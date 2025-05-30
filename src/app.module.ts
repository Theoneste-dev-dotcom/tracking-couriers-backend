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
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { BranchesModule } from './branches/branches.module';
import { rootCertificates } from 'tls';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
  ServeStaticModule.forRoot({ 
    rootPath: join(__dirname, '..', 'uploads','profilepics'),
    serveRoot: '/uploads/profilepics', // Adjust the path to your static files
  }),
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
        logging: false, 
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    ShipmentsModule,
    TrackingModule,
    NotificationsModule,
    CronModule,
    SubscriptionModule,
    BranchesModule
  ],

  controllers:[AppController],
 

})
export class AppModule {}