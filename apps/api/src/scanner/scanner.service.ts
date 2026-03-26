import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as Sentry from '@sentry/nestjs';
import { ScanResult as PrismaScanResult, ScanType as PrismaScanType } from '@prisma/client';
import {
  ScanResult,
  ScanType,
  ApprovalStatus,
  PassStatus,
  ResidentQrPayload,
  GuestPassQrPayload,
  ScanValidationResult,
} from '@simsim/types';
import { Scanner } from '@prisma/client';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateResident(scanner: Scanner, qrToken: string): Promise<ScanValidationResult> {
    // 1. Verify QR token
    let payload: ResidentQrPayload;
    try {
      payload = this.jwtService.verify<ResidentQrPayload>(qrToken, {
        secret: this.config.get<string>('JWT_QR_SECRET'),
      });
    } catch {
      return this.deny(scanner, ScanType.Resident, 'Invalid or expired QR code');
    }

    if (payload.type !== 'resident_access') {
      return this.deny(scanner, ScanType.Resident, 'Invalid token type');
    }

    // 2. Find user
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') {
      return this.deny(scanner, ScanType.Resident, 'User not found or inactive');
    }

    // 3. Find approved membership for this community
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: user.id,
        community_id: scanner.community_id,
        approval_status: ApprovalStatus.Approved,
        OR: [{ end_date: null }, { end_date: { gt: new Date() } }],
      },
      include: { unit: true },
    });

    if (!membership) {
      return this.deny(
        scanner,
        ScanType.Resident,
        'No approved membership for this community',
        user.id,
        user.full_name ?? user.phone_number,
        user.phone_number,
      );
    }

    // 4. Grant access
    await this.writeLog({
      community_id: scanner.community_id,
      scanner_id: scanner.id,
      scanner_code: scanner.scanner_code,
      scan_type: ScanType.Resident,
      user_id: user.id,
      membership_id: membership.id,
      resident_name: user.full_name ?? user.phone_number,
      resident_phone: user.phone_number,
      unit_id: membership.unit_id ?? undefined,
      unit_code: membership.unit?.unit_code ?? undefined,
      result: ScanResult.Granted,
    });

    // Get community name
    const community = await this.prisma.community.findUnique({
      where: { id: scanner.community_id },
    });

    return {
      result: ScanResult.Granted,
      resident_name: user.full_name ?? user.phone_number,
      unit_code: membership.unit?.unit_code ?? undefined,
      photo_url: user.profile_photo_url ?? undefined,
      community_name: community?.name,
    };
  }

  async validatePass(scanner: Scanner, passToken: string): Promise<ScanValidationResult> {
    // 1. Verify pass token
    let payload: GuestPassQrPayload;
    try {
      payload = this.jwtService.verify<GuestPassQrPayload>(passToken, {
        secret: this.config.get<string>('JWT_QR_SECRET'),
      });
    } catch {
      return this.deny(scanner, ScanType.Guest, 'Invalid or expired pass QR code');
    }

    if (payload.type !== 'guest_access') {
      return this.deny(scanner, ScanType.Guest, 'Invalid token type');
    }

    // 2. Find guest pass
    const pass = await this.prisma.guestPass.findUnique({
      where: { id: payload.sub },
      include: {
        host_user: true,
        host_membership: { include: { unit: true } },
      },
    });

    if (!pass) {
      return this.deny(scanner, ScanType.Guest, 'Guest pass not found');
    }

    // 3. Validate token version (anti-replay)
    if (pass.qr_token_version !== payload.v) {
      return this.deny(scanner, ScanType.Guest, 'Guest pass has been invalidated');
    }

    // 4. Check pass belongs to this community
    if (pass.community_id !== scanner.community_id) {
      return this.deny(scanner, ScanType.Guest, 'Pass not valid for this community');
    }

    // 5. Check pass status and validity
    const now = new Date();
    if (pass.status !== PassStatus.Active) {
      return this.deny(scanner, ScanType.Guest, `Pass is ${pass.status}`);
    }
    if (now < pass.valid_from || now > pass.valid_until) {
      return this.deny(scanner, ScanType.Guest, 'Pass is outside its valid time window');
    }

    // 6. Atomically increment usage — WHERE guard prevents over-consumption under concurrency.
    //    A single SQL UPDATE ... WHERE usage_count < usage_limit handles the check+increment
    //    atomically, so two simultaneous scans cannot both succeed when at the limit.
    const incremented = await this.prisma.guestPass.updateMany({
      where: {
        id: pass.id,
        usage_count: { lt: pass.usage_limit },
        status: PassStatus.Active,
        qr_token_version: payload.v, // re-validate version atomically
      },
      data: { usage_count: { increment: 1 } },
    });

    if (incremented.count === 0) {
      return this.deny(scanner, ScanType.Guest, 'Pass usage limit reached');
    }

    // 7. Log
    await this.writeLog({
      community_id: scanner.community_id,
      scanner_id: scanner.id,
      scanner_code: scanner.scanner_code,
      scan_type: ScanType.Guest,
      guest_pass_id: pass.id,
      resident_name: pass.guest_name,
      resident_phone: pass.guest_phone,
      unit_id: pass.host_membership.unit_id ?? undefined,
      unit_code: pass.host_membership.unit?.unit_code ?? undefined,
      result: ScanResult.Granted,
    });

    return {
      result: ScanResult.Granted,
      guest_name: pass.guest_name,
      host_name: pass.host_user.full_name ?? pass.host_user.phone_number,
      host_unit: pass.host_membership.unit?.unit_code ?? undefined,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async deny(
    scanner: Scanner,
    scanType: ScanType,
    reason: string,
    userId?: string,
    residentName?: string,
    residentPhone?: string,
  ): Promise<ScanValidationResult> {
    await this.writeLog({
      community_id: scanner.community_id,
      scanner_id: scanner.id,
      scanner_code: scanner.scanner_code,
      scan_type: scanType,
      user_id: userId,
      resident_name: residentName,
      resident_phone: residentPhone,
      result: ScanResult.Denied,
      denial_reason: reason,
    });
    return { result: ScanResult.Denied, denial_reason: reason };
  }

  private async writeLog(data: {
    community_id: string;
    scanner_id: string;
    scanner_code: string;
    scan_type: PrismaScanType;
    user_id?: string;
    membership_id?: string;
    guest_pass_id?: string;
    resident_name?: string;
    resident_phone?: string;
    unit_id?: string;
    unit_code?: string;
    result: PrismaScanResult;
    denial_reason?: string;
  }) {
    try {
      await this.prisma.accessLog.create({ data });
    } catch (err) {
      this.logger.error('Failed to write access log', err);
      Sentry.captureException(err, { tags: { event: 'access_log_write_failed' } });
    }
  }
}
