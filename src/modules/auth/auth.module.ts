import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'process';

@Module({
  imports:[forwardRef(()=> UsersModule), 
    ConfigModule.forRoot({
      isGlobal:true
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET_KEY');
        return {
          secret: secret,
          signOptions: { expiresIn: '1h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, JwtService],
  exports:[AuthService, AuthGuard, RolesGuard, JwtModule, JwtService]

})
export class AuthModule {}