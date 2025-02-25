import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard)
  @Post('refresh-token')
  async refresh(@Req() req) {
    return this.authService.refreshToken(req.user.id, req.body.refreshToken);
  }
}
