import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashOtp(otp: string, secret = 'test-secret'): string {
  return createHmac('sha256', secret).update(otp).digest('hex');
}

function makeOtpRecord(overrides: Partial<{
  id: string;
  phone_number: string;
  otp_hash: string;
  attempts: number;
  used: boolean;
  expires_at: Date;
  created_at: Date;
}> = {}) {
  return {
    id: 'otp-1',
    phone_number: '+971501234567',
    otp_hash: hashOtp('123456'),
    attempts: 0,
    used: false,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    created_at: new Date(),
    ...overrides,
  };
}

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    otpVerification: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const cfg: Record<string, string> = {
        NODE_ENV: 'development',
        OTP_HASH_SECRET: 'test-secret',
        TWILIO_ACCOUNT_SID: 'AC_test',
        TWILIO_AUTH_TOKEN: 'test_token',
      };
      return cfg[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── requestOtp ─────────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('returns dev message when NODE_ENV=development', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null); // no recent OTP
      mockPrisma.otpVerification.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.otpVerification.create.mockResolvedValue({});

      const result = await service.requestOtp('+971501234567');

      expect(result.message).toContain('dev');
      expect(mockPrisma.otpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone_number: '+971501234567',
            otp_hash: hashOtp('123456'), // dev always uses 123456
          }),
        }),
      );
    });

    it('normalizes phone — prepends + if missing', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);
      mockPrisma.otpVerification.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.otpVerification.create.mockResolvedValue({});

      await service.requestOtp('971501234567'); // no leading +

      expect(mockPrisma.otpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone_number: '+971501234567' }),
        }),
      );
    });

    it('enforces 60s resend cooldown per phone', async () => {
      // Simulate a recent OTP (within cooldown window)
      const createdAt = new Date(Date.now() - 30_000); // 30s ago
      mockPrisma.otpVerification.findFirst.mockResolvedValue(
        makeOtpRecord({ created_at: createdAt }),
      );

      await expect(service.requestOtp('+971501234567')).rejects.toThrow(
        HttpException,
      );
      expect(mockPrisma.otpVerification.create).not.toHaveBeenCalled();
    });

    it('invalidates previous unused OTPs before creating a new one', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);
      mockPrisma.otpVerification.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.otpVerification.create.mockResolvedValue({});

      await service.requestOtp('+971501234567');

      expect(mockPrisma.otpVerification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone_number: '+971501234567', used: false },
          data: { used: true },
        }),
      );
    });
  });

  // ─── verifyOtp ───────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const phone = '+971501234567';
    const mockUser = {
      id: 'user-1',
      phone_number: phone,
      full_name: 'Test User',
      profile_photo_url: null,
      status: 'active',
      role_type: 'user',
    };

    it('returns access_token + user on correct OTP', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(makeOtpRecord());
      mockPrisma.otpVerification.update.mockResolvedValue({});
      mockPrisma.user.upsert.mockResolvedValue(mockUser);

      const result = await service.verifyOtp(phone, '123456');

      expect(result.access_token).toBe('jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(mockPrisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: true } }),
      );
    });

    it('throws UnauthorizedException when no valid OTP record found', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp(phone, '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException and invalidates record at attempt limit', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(
        makeOtpRecord({ attempts: 5 }),
      );
      mockPrisma.otpVerification.update.mockResolvedValue({});

      await expect(service.verifyOtp(phone, '123456')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: true } }),
      );
    });

    it('increments attempts on wrong OTP', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(
        makeOtpRecord({ attempts: 2 }),
      );
      mockPrisma.otpVerification.update.mockResolvedValue({});

      await expect(service.verifyOtp(phone, 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { attempts: { increment: 1 } },
        }),
      );
    });

    it('does not reveal remaining attempts when at 0', async () => {
      mockPrisma.otpVerification.findFirst.mockResolvedValue(
        makeOtpRecord({ attempts: 4 }), // one left, but wrong OTP → 0 remaining
      );
      mockPrisma.otpVerification.update.mockResolvedValue({});

      await expect(service.verifyOtp(phone, 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
