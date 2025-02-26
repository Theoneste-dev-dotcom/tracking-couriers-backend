import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from '../users/dto/login-response.dto';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any):Promise<LoginResponseDto>{
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.userService.updateRefreshToken(user.id, refreshToken);
    return new LoginResponseDto("Logged in successfull!! ", accessToken, refreshToken)
  }

  async refreshToken(userId: number, token: string) {
    const user = await this.userService.findUser(userId)
    if (!user || user.refreshToken !== token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    return this.login(user);
  }

  validateToken(token: string) {
    return this.jwtService.verify(token, {
        secret : process.env.JWT_SECRET_KEY
    });
}
}
