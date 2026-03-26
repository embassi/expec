import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService, QUEUE_JOBS } from '../queue/queue.service';
import { SendGuestPassJobData } from '../queue/job-types';
import * as Sentry from '@sentry/nestjs';
import { CreateGuestPassDto } from './dto/create-guest-pass.dto';
import {
  PassType,
  PassStatus,
  ApprovalStatus,
  RelationshipType,
  GuestPassQrPayload,
} from '@simsim/types';
import { Prisma } from '@prisma/client';
import { Twilio } from 'twilio';

@Injectable()
export class GuestPassesService implements OnModuleInit {
  private readonly logger = new Logger(GuestPassesService.name);
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private queue: QueueService,
  ) {
    this.twilioClient = new Twilio(
      this.config.get('TWILIO_ACCOUNT_SID'),
      this.config.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async onModuleInit() {
    await this.queue.registerWorker<SendGuestPassJobData>(
      QUEUE_JOBS.SEND_GUEST_PASS,
      async (jobs) => {
        for (const job of jobs) {
          const { guestPhone, guestName, passUrl, passType } = job.data;
          await this.sendPassLink(guestPhone, guestName, passUrl, passType as PassType);
        }
      },
    );
  }

  async createPass(userId: string, dto: CreateGuestPassDto) {
    // Find approved membership
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        community_id: dto.community_id,
        approval_status: ApprovalStatus.Approved,
      },
    });
    if (!membership) {
      throw new ForbiddenException('No approved membership in this community');
    }

    // Check permission by relationship type
    const policy = await this.getOrCreatePolicy(dto.community_id);
    this.assertCanGeneratePass(membership.relationship_type, policy);

    // Get duration & usage from policy
    const { durationHours, usageLimit } = this.getPassDefaults(dto.pass_type, policy);

    const now = new Date();
    const validUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    // Wrap limit check + create in a serializable transaction to prevent
    // two concurrent requests both passing the limit check and both creating passes.
    const pass = await this.prisma.$transaction(
      async (tx) => {
        await this.checkLimits(userId, dto.community_id, policy, tx);

        return tx.guestPass.create({
          data: {
            community_id: dto.community_id,
            host_user_id: userId,
            host_membership_id: membership.id,
            guest_name: dto.guest_name,
            guest_phone: dto.guest_phone,
            pass_type: dto.pass_type,
            status: PassStatus.Active,
            valid_from: now,
            valid_until: validUntil,
            usage_limit: usageLimit,
            usage_count: 0,
            qr_token_version: 1,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Generate signed pass token (no expiry — the pass itself carries validity)
    const passToken = this.generatePassToken(pass.id, pass.qr_token_version);
    const passUrl = `${this.config.get('APP_BASE_URL')}/pass/${passToken}`;

    // Enqueue WhatsApp send — async with up to 3 retries; pass is already persisted
    await this.queue.enqueue<SendGuestPassJobData>(QUEUE_JOBS.SEND_GUEST_PASS, {
      guestPhone: dto.guest_phone,
      guestName: dto.guest_name,
      passUrl,
      passType: dto.pass_type,
    });

    return {
      id: pass.id,
      pass_type: pass.pass_type,
      valid_from: pass.valid_from,
      valid_until: pass.valid_until,
      usage_limit: pass.usage_limit,
      pass_url: passUrl,
    };
  }

  async getMyPasses(userId: string) {
    const now = new Date();
    return this.prisma.guestPass.findMany({
      where: { host_user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        guest_name: true,
        guest_phone: true,
        pass_type: true,
        status: true,
        valid_from: true,
        valid_until: true,
        usage_limit: true,
        usage_count: true,
        created_at: true,
        community: { select: { name: true } },
      },
    });
  }

  // Public endpoint — no auth needed
  async getPassQrData(passToken: string) {
    let payload: GuestPassQrPayload;
    try {
      payload = this.jwtService.verify<GuestPassQrPayload>(passToken, {
        secret: this.config.get<string>('JWT_QR_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid pass link');
    }

    const pass = await this.prisma.guestPass.findUnique({
      where: { id: payload.sub },
      include: {
        host_user: { select: { full_name: true, phone_number: true } },
        community: { select: { name: true } },
      },
    });
    if (!pass || pass.qr_token_version !== payload.v) {
      throw new NotFoundException('Pass not found or has been cancelled');
    }

    return {
      pass_token: passToken,
      guest_name: pass.guest_name,
      pass_type: pass.pass_type,
      status: pass.status,
      valid_from: pass.valid_from,
      valid_until: pass.valid_until,
      usage_limit: pass.usage_limit,
      usage_count: pass.usage_count,
      host_name: pass.host_user.full_name ?? pass.host_user.phone_number,
      community_name: pass.community.name,
    };
  }

  async cancelPass(userId: string, passId: string) {
    const pass = await this.prisma.guestPass.findUnique({ where: { id: passId } });
    if (!pass) throw new NotFoundException('Pass not found');
    if (pass.host_user_id !== userId) throw new ForbiddenException();

    await this.prisma.guestPass.update({
      where: { id: passId },
      data: {
        status: PassStatus.Cancelled,
        qr_token_version: { increment: 1 }, // invalidate existing QR
      },
    });
    return { message: 'Pass cancelled' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generatePassToken(passId: string, version: number): string {
    const payload: GuestPassQrPayload = {
      sub: passId,
      type: 'guest_access',
      v: version,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year (pass itself governs validity)
    };
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_QR_SECRET'),
      expiresIn: '365d',
    });
  }

  private getPassDefaults(passType: PassType, policy: any) {
    switch (passType) {
      case PassType.Guest:
        return {
          durationHours: policy.guest_pass_guest_duration_hours,
          usageLimit: policy.guest_pass_guest_usage_limit,
        };
      case PassType.Delivery:
        return {
          durationHours: policy.guest_pass_delivery_duration_hours,
          usageLimit: policy.guest_pass_delivery_usage_limit,
        };
      case PassType.ServiceProvider:
        return {
          durationHours: policy.guest_pass_service_duration_hours,
          usageLimit: policy.guest_pass_service_usage_limit,
        };
    }
  }

  private assertCanGeneratePass(relationshipType: string | null, policy: any) {
    const allowed =
      (relationshipType === RelationshipType.Family && policy.family_can_generate_guest_passes) ||
      (relationshipType === RelationshipType.Tenant && policy.tenant_can_generate_guest_passes) ||
      (relationshipType === RelationshipType.Staff && policy.staff_can_generate_guest_passes) ||
      relationshipType === RelationshipType.Owner;

    if (!allowed) {
      throw new ForbiddenException('Your membership type is not permitted to create guest passes');
    }
  }

  private async checkLimits(
    userId: string,
    communityId: string,
    policy: any,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [activeCount, todayCount] = await Promise.all([
      db.guestPass.count({
        where: {
          host_user_id: userId,
          community_id: communityId,
          status: PassStatus.Active,
          valid_until: { gt: now },
        },
      }),
      db.guestPass.count({
        where: {
          host_user_id: userId,
          community_id: communityId,
          created_at: { gte: startOfDay },
        },
      }),
    ]);

    if (activeCount >= policy.max_active_guest_passes_per_host) {
      throw new BadRequestException('Active guest pass limit reached');
    }
    if (todayCount >= policy.max_guest_passes_per_day) {
      throw new BadRequestException('Daily guest pass limit reached');
    }
  }

  private async getOrCreatePolicy(communityId: string) {
    let policy = await this.prisma.communityPolicy.findUnique({
      where: { community_id: communityId },
    });
    if (!policy) {
      policy = await this.prisma.communityPolicy.create({
        data: { community_id: communityId },
      });
    }
    return policy;
  }

  private async sendPassLink(guestPhone: string, guestName: string, passUrl: string, passType: PassType) {
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    const to = `whatsapp:${guestPhone}`;
    const typeLabel = passType === PassType.Guest ? 'visitor' : passType === PassType.Delivery ? 'delivery' : 'service';
    const body = `Hi ${guestName}! You have received a ${typeLabel} pass.\n\nTap the link below to view your QR code for entry:\n${passUrl}`;

    try {
      await this.twilioClient.messages.create({ from, to, body });
    } catch (err) {
      this.logger.error(`Failed to send pass link to ${guestPhone}`, err);
      Sentry.captureException(err, { tags: { event: 'guest_pass_send_failed' } });
      throw err; // re-throw so pg-boss retries the job
    }
  }
}
