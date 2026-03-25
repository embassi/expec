import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Twilio } from 'twilio';

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

  async requestOtp(phoneNumber: string): Promise<{ message: string }> {
    const isDev = this.config.get('NODE_ENV') !== 'production';

    // Invalidate previous unused OTPs for this number
    await this.prisma.otpVerification.updateMany({
      where: { phone_number: phoneNumber, used: false },
      data: { used: true },
    });

    const otp = isDev ? '123456' : this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpVerification.create({
      data: {
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt,
      },
    });

    if (isDev) {
      this.logger.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
    } else {
      await this.sendWhatsAppOtp(phoneNumber, otp);
    }

    return { message: isDev ? 'OTP sent (dev: use 123456)' : 'OTP sent via WhatsApp' };
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<{ access_token: string; user: any }> {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        otp_code: otp,
        used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Upsert user — if invited, activate on first login
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

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendWhatsAppOtp(phoneNumber: string, otp: string): Promise<void> {
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    const to = `whatsapp:${phoneNumber}`;
    const contentSid = this.config.get<string>('TWILIO_OTP_TEMPLATE_SID');

    this.logger.log(`Sending OTP: from=${from} to=${to}`);
    try {
      // Use approved template if configured (required for first-time users outside 24h window)
      // otherwise fall back to freeform (works within active session)
      const params = contentSid
        ? { from, to, contentSid, contentVariables: JSON.stringify({ 1: otp }) }
        : { from, to, body: `Your Simsim verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.` };

      const msg = await this.twilioClient.messages.create(params as Parameters<typeof this.twilioClient.messages.create>[0]);
      this.logger.log(`Twilio message SID=${msg.sid} status=${msg.status}`);
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp OTP to ${phoneNumber}`, err);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }
}
