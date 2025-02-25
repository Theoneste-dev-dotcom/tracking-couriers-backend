import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[forwardRef(()=> UsersModule), 
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY as string,
      signOptions:{expiresIn:'1h'}
    }),
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports:[AuthService, AuthGuard, RolesGuard, JwtModule]

})
export class AuthModule {}