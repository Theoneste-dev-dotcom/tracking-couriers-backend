import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from '../users/dto/login-response.dto';
import { User } from '../users/entities/user.entity';
import { UserLoginDto } from '../users/dto/user-login.dto';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    const isvalid  =  await bcrypt.compare(password, user.password)
    if(isvalid) {
      return user
    } else {
      console.log(isvalid, "use is valid??")
      return user
    }
    
  }

  async login(user: UserLoginDto):Promise<LoginResponseDto>{
    try {
      const validUser = await this.validateUser(user.email, user.email)
    const payload = { email: validUser.email, sub: validUser.id, role: validUser.role };
    const accessToken = this.jwtService.sign(payload, {secret:this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {secret:this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '7d' });

    await this.userService.updateRefreshToken(validUser.id, refreshToken);
    return new LoginResponseDto("Logged in successfull!! ", accessToken, refreshToken, validUser.name, validUser.email, validUser.role)
    }catch(error) {
      console.log(error)
      throw new Error("Failed to login for user "+ user.email)
    }
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
