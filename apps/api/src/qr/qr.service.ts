import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResidentQrPayload } from '@simsim/types';

@Injectable()
export class QrService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  generateResidentQrToken(userId: string): { qr_token: string; expires_at: string } {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 30; // 30-second expiry

    const payload: ResidentQrPayload = {
      sub: userId,
      type: 'resident_access',
      iat: now,
      exp,
    };

    const qr_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_QR_SECRET'),
    });

    return {
      qr_token,
      expires_at: new Date(exp * 1000).toISOString(),
    };
  }

  verifyResidentQrToken(token: string): ResidentQrPayload {
    return this.jwtService.verify<ResidentQrPayload>(token, {
      secret: this.config.get<string>('JWT_QR_SECRET'),
    });
  }
}
