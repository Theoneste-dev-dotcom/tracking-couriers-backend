import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(loginDto: any) {
    // Implement your login logic here
    return { accessToken: 'token' }; // Example response
  }
}