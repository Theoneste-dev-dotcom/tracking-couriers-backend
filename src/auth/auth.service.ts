import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      role: user.role,
      userId: user.id,
    };
  }

  async createUser(body: { email: string; password: string; name: string }) {
    // Check if the user already exists
    const existingUser = await this.userService.findByEmail(body.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
  
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const newUser = await this.userService.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
    });
  
    return newUser;
  }
  
}