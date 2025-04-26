import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from '../users/dto/login-response.dto';
import { User } from '../users/entities/user.entity';
import { UserLoginDto } from '../users/dto/user-login.dto';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    console.log(user);
    const isvalid = await bcrypt.compare(password, user.password);
    if (isvalid) {
      return user;
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: UserLoginDto) {
    try {
      const validUser = await this.validateUser(user.email, user.password);
      const payload = {
        email: validUser.email,
        sub: validUser.id,
        role: validUser.role,
        name: validUser.name,
      };
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '2d',
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '7d',
      });
      //  const isPasswordValid = this.
      await this.userService.updateRefreshToken(validUser.id, refreshToken);
      return new LoginResponseDto(
        validUser.id,
        200,
        'Logged in successfull!! ',
        accessToken,
        refreshToken,
        validUser.name,
        validUser.email,
        validUser.role,
      );
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(
        'Invalid credentials, pls check you email and address',
      );
    }
  }

  async refreshToken(userId: number, refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });

      const user = await this.userService.findOneById(payload.sub);
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const access_token = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET_KEY,
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: '7d',
    });

    // to be done after
    // await this.userService.update(user.id, {refreshToken: refreshToken})
    return refreshToken;
  }

  async verifyToken(
    token: string,
    isWs: boolean = false,
  ): Promise<User | null> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET_KEY');
      if (!secret) {
        throw new Error('Failed to get the secret');
      }

      if (!token) {
        console.log('failed to get the token');
      }

      const payload = await this.jwtService.verify(token, { secret });

      const user = await this.userService.findOneById(payload.sub);
    if(user) return user;
    else return null;
     
    } catch (err) {
      console.log(err);
      if (isWs) {
        throw new WsException(err.message);
      } else {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }
    }
  }
}
