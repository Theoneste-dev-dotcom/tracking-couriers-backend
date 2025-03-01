import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from '../users/dto/login-response.dto';
import { User } from '../users/entities/user.entity';


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
    console.log('the key is ', this.configService.get<string>('JWT_SECRET_KEY'))
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {secret:this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {secret:this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '7d' });

    await this.userService.updateRefreshToken(user.id, refreshToken);
    return new LoginResponseDto("Logged in successfull!! ", accessToken, refreshToken, user.name, user.email, user.role)
  }

  async refreshToken(userId: number, refreshToken: string) {
    try{
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_SECRET_KEY')
    });

    const user = await this.userService.findOneById(payload.sub)
    if(user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token')
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
        secret : process.env.JWT_SECRET_KEY
    });
}

async generateRefreshToken(user:User):Promise<string> {
  const payload = {sub: user.id, email: user.email} 
  const refreshToken = await this.jwtService.signAsync(payload,  {
    secret: this.configService.get<string>('JWT_SECRET_KEY'),
    expiresIn: '7d'
  })
  await this.userService.update(user.id, {refreshToken: refreshToken})
  return refreshToken
}
}
