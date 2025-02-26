import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports:[forwardRef(()=> UsersModule), 
    JwtModule.registerAsync({
      imports:[ConfigModule],
      useFactory: async(configService:ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions:{expiresIn:'1h'}
      }),
      inject:[ConfigService]
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports:[AuthService, AuthGuard, RolesGuard, JwtModule]

})
export class AuthModule {}