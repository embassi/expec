import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

/**
 * Auth endpoints get a tighter IP-level rate limit than the global default.
 * Per-phone cooldown (60s resend) and attempt limits (5 max) are enforced
 * in AuthService regardless of IP.
 */
@Public()
@Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 auth attempts per minute per IP
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone_number);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone_number, dto.otp);
  }

  @Post('request-email-otp')
  @HttpCode(HttpStatus.OK)
  requestEmailOtp(@Body() dto: RequestEmailOtpDto) {
    return this.authService.requestEmailOtp(dto.email);
  }

  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto.email, dto.otp);
  }

  /**
   * Called by the dashboard/mobile after successful Supabase Auth login.
   * Ensures a matching row exists in our users table and returns it.
   * The Supabase JWT is verified by the JWT guard before this runs.
   */
  @Post('sync-user')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  syncUser(@CurrentUser() user: User) {
    return this.authService.syncUser(user);
  }
}
