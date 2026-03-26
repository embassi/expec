import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Twilio } from 'twilio';
import { createHmac } from 'crypto';
import * as Sentry from '@sentry/nestjs';

const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60_000; // 60 seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.twilioClient = new Twilio(
      this.config.get('TWILIO_ACCOUNT_SID'),
      this.config.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async requestOtp(rawPhone: string): Promise<{ message: string }> {
    const phoneNumber = this.normalizePhone(rawPhone);

    // Resend cooldown — prevent spam per phone number (independent of IP throttle)
    const recent = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        created_at: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
      },
      orderBy: { created_at: 'desc' },
    });

    if (recent) {
      const waitMs = recent.created_at.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
      const waitSec = Math.ceil(waitMs / 1000);
      throw new HttpException(
        { message: `Please wait ${waitSec}s before requesting another OTP` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Invalidate any previous unused OTPs for this number
    await this.prisma.otpVerification.updateMany({
      where: { phone_number: phoneNumber, used: false },
      data: { used: true },
    });

    // Only use fixed OTP in explicit development mode (not just !production)
    const isDev = this.config.get('NODE_ENV') === 'development';
    const otp = isDev ? '123456' : this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: {
        phone_number: phoneNumber,
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
    });

    if (isDev) {
      // OTP is only logged in development — never emitted in production
      this.logger.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
    } else {
      await this.sendWhatsAppOtp(phoneNumber, otp);
    }

    return { message: isDev ? 'OTP sent (dev: use 123456)' : 'OTP sent via WhatsApp' };
  }

  async verifyOtp(
    rawPhone: string,
    otp: string,
  ): Promise<{ access_token: string; user: any }> {
    const phoneNumber = this.normalizePhone(rawPhone);

    // Find the latest active (non-expired, non-used) OTP for this phone
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hard limit on failed attempts — prevents brute force even within the 5-minute window
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { used: true },
      });
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    const otpHash = this.hashOtp(otp);

    if (record.otp_hash !== otpHash) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_OTP_ATTEMPTS - record.attempts - 1;
      throw new UnauthorizedException(
        remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Invalid OTP',
      );
    }

    // Mark OTP as used
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Upsert user — activate if previously invited
    const user = await this.prisma.user.upsert({
      where: { phone_number: phoneNumber },
      update: { status: 'active' },
      create: { phone_number: phoneNumber, role_type: 'user', status: 'active' },
    });

    const accessToken = this.jwtService.sign({ sub: user.id });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        profile_photo_url: user.profile_photo_url,
        status: user.status,
        role_type: user.role_type,
      },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * HMAC-SHA256 hash of the OTP using a server-side secret.
   * A DB-only attacker cannot reverse the OTP without the secret key.
   * Falls back to JWT_SECRET if OTP_HASH_SECRET is not set.
   */
  private hashOtp(otp: string): string {
    const secret =
      this.config.get<string>('OTP_HASH_SECRET') ??
      this.config.get<string>('JWT_SECRET') ??
      'dev-fallback-secret';
    return createHmac('sha256', secret).update(otp).digest('hex');
  }

  /** Ensures phone is in international format: strips whitespace, prepends + if missing */
  private normalizePhone(phone: string): string {
    const trimmed = phone.trim().replace(/\s+/g, '');
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendWhatsAppOtp(phoneNumber: string, otp: string): Promise<void> {
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    const to = `whatsapp:${phoneNumber}`;
    const contentSid = this.config.get<string>('TWILIO_OTP_TEMPLATE_SID');

    this.logger.log(`Sending OTP to ${phoneNumber}`);
    try {
      const params = contentSid
        ? { from, to, contentSid, contentVariables: JSON.stringify({ 1: otp }) }
        : {
            from,
            to,
            body: `Your Simsim verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
          };

      const msg = await this.twilioClient.messages.create(
        params as Parameters<typeof this.twilioClient.messages.create>[0],
      );
      this.logger.log(`OTP dispatched SID=${msg.sid}`);
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp OTP to ${phoneNumber}`, err);
      Sentry.captureException(err, { tags: { event: 'otp_send_failed' } });
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }
}
