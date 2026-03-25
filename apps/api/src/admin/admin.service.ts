import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { AssignOwnerDto } from './dto/assign-owner.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { ApprovalStatus, RelationshipType, RoleType, AnnouncementStatus } from '@simsim/types';
import { randomBytes } from 'crypto';
import { Twilio } from 'twilio';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.twilioClient = new Twilio(
      this.config.get('TWILIO_ACCOUNT_SID'),
      this.config.get('TWILIO_AUTH_TOKEN'),
    );
  }

  // ─── Communities ───────────────────────────────────────────────────────────

  async createCommunity(dto: CreateCommunityDto) {
    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type ?? 'residential',
      },
    });
    // Create default policies
    await this.prisma.communityPolicy.create({
      data: { community_id: community.id },
    });
    return community;
  }

  async listCommunities() {
    return this.prisma.community.findMany({ orderBy: { created_at: 'desc' } });
  }

  // ─── Units ─────────────────────────────────────────────────────────────────

  async createUnit(dto: CreateUnitDto, managerId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: dto.community_id } });
    if (!community) throw new NotFoundException('Community not found');

    return this.prisma.unit.create({
      data: {
        community_id: dto.community_id,
        unit_code: dto.unit_code,
        unit_type: dto.unit_type,
        floor: dto.floor,
        building: dto.building,
      },
    });
  }

  async listUnits(communityId: string) {
    return this.prisma.unit.findMany({
      where: { community_id: communityId },
      include: {
        memberships: {
          where: { approval_status: ApprovalStatus.Approved },
          include: { user: { select: { full_name: true, phone_number: true } } },
        },
      },
      orderBy: { unit_code: 'asc' },
    });
  }

  // ─── Assign Owner ──────────────────────────────────────────────────────────

  async assignOwner(communityId: string, dto: AssignOwnerDto, managerId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unit_id, community_id: communityId },
    });
    if (!unit) throw new NotFoundException('Unit not found in this community');

    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const user = await this.prisma.user.upsert({
      where: { phone_number: dto.phone_number },
      update: {},
      create: { phone_number: dto.phone_number, role_type: 'user', status: 'invited' },
    });

    // Check existing owner membership
    const existing = await this.prisma.membership.findFirst({
      where: {
        user_id: user.id,
        community_id: communityId,
        unit_id: unit.id,
        relationship_type: RelationshipType.Owner,
        approval_status: { in: [ApprovalStatus.Approved, ApprovalStatus.Pending] },
      },
    });
    if (existing) throw new ConflictException('User is already an owner of this unit');

    const membership = await this.prisma.membership.create({
      data: {
        user_id: user.id,
        community_id: communityId,
        unit_id: unit.id,
        relationship_type: RelationshipType.Owner,
        role_type: RoleType.Resident,
        approval_status: ApprovalStatus.Approved,
        created_by_manager_id: managerId,
      },
    });

    // Send WhatsApp welcome message (fire-and-forget)
    this.sendWelcomeMessage(dto.phone_number, community.name).catch(err =>
      this.logger.warn(`Failed to send welcome WhatsApp to ${dto.phone_number}: ${err.message}`),
    );

    return membership;
  }

  // ─── Memberships ───────────────────────────────────────────────────────────

  async listMemberships(communityId: string, status?: string) {
    return this.prisma.membership.findMany({
      where: {
        community_id: communityId,
        ...(status ? { approval_status: status } : {}),
      },
      include: {
        user: { select: { full_name: true, phone_number: true, profile_photo_url: true, status: true } },
        unit: { select: { unit_code: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateMembershipStatus(membershipId: string, dto: UpdateMembershipStatusDto) {
    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new NotFoundException('Membership not found');

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { approval_status: dto.approval_status },
    });
  }

  // ─── Scanners ──────────────────────────────────────────────────────────────

  async createScanner(dto: CreateScannerDto) {
    const existing = await this.prisma.scanner.findUnique({
      where: { scanner_code: dto.scanner_code },
    });
    if (existing) throw new ConflictException('Scanner code already exists');

    const deviceKey = randomBytes(32).toString('hex');

    return this.prisma.scanner.create({
      data: {
        community_id: dto.community_id,
        scanner_name: dto.scanner_name,
        scanner_code: dto.scanner_code,
        location_label: dto.location_label,
        device_key: deviceKey,
      },
      // Return device_key only on creation — it won't be shown again
    });
  }

  async listScanners(communityId: string) {
    return this.prisma.scanner.findMany({
      where: { community_id: communityId },
      select: {
        id: true,
        scanner_name: true,
        scanner_code: true,
        location_label: true,
        is_active: true,
        created_at: true,
        assigned_user_id: true,
        assigned_user: { select: { full_name: true, phone_number: true } },
        // device_key intentionally excluded from list
      },
    });
  }

  async assignScanner(scannerId: string, phoneNumber: string | null) {
    if (phoneNumber === null) {
      return this.prisma.scanner.update({
        where: { id: scannerId },
        data: { assigned_user_id: null },
      });
    }

    const user = await this.prisma.user.findUnique({ where: { phone_number: phoneNumber } });
    if (!user) throw new NotFoundException('User not found with this phone number');

    return this.prisma.scanner.update({
      where: { id: scannerId },
      data: { assigned_user_id: user.id },
    });
  }

  async toggleScanner(scannerId: string) {
    const scanner = await this.prisma.scanner.findUniqueOrThrow({ where: { id: scannerId } });
    return this.prisma.scanner.update({
      where: { id: scannerId },
      data: { is_active: !scanner.is_active },
    });
  }

  // ─── Overview ──────────────────────────────────────────────────────────────

  async getOverview() {
    const [total_communities, total_members, pending_memberships] = await Promise.all([
      this.prisma.community.count(),
      this.prisma.membership.count({ where: { approval_status: 'approved' } }),
      this.prisma.membership.count({ where: { approval_status: 'pending' } }),
    ]);
    return { total_communities, total_members, pending_memberships };
  }

  // ─── Announcements ─────────────────────────────────────────────────────────

  async createAnnouncement(dto: CreateAnnouncementDto, managerId: string) {
    const status = dto.status ?? AnnouncementStatus.Published;
    return this.prisma.announcement.create({
      data: {
        community_id: dto.community_id,
        title: dto.title,
        body: dto.body,
        image_url: dto.image_url,
        published_by: managerId,
        published_at: status === AnnouncementStatus.Published ? new Date() : null,
        status,
      },
    });
  }

  async listAnnouncements(communityId: string) {
    return this.prisma.announcement.findMany({
      where: { community_id: communityId },
      orderBy: { published_at: 'desc' },
    });
  }

  // ─── Access Logs ───────────────────────────────────────────────────────────

  async getAccessLogs(communityId: string, limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { community_id: communityId },
        orderBy: { scanned_at: 'desc' },
        take: limit,
        skip: offset,
        include: {
          scanner: { select: { scanner_name: true } },
        },
      }),
      this.prisma.accessLog.count({ where: { community_id: communityId } }),
    ]);
    return { logs, total, limit, offset };
  }

  // ─── Policies ──────────────────────────────────────────────────────────────

  async getPolicy(communityId: string) {
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

  async updatePolicy(communityId: string, dto: UpdatePolicyDto) {
    return this.prisma.communityPolicy.upsert({
      where: { community_id: communityId },
      update: dto,
      create: { community_id: communityId, ...dto },
    });
  }

  // ─── Service Requests ──────────────────────────────────────────────────────

  async listServiceRequests(communityId: string, status?: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        community_id: communityId,
        ...(status ? { status } : {}),
      },
      include: {
        user: { select: { full_name: true, phone_number: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateServiceRequestStatus(requestId: string, status: string) {
    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  // ─── Add Manager ───────────────────────────────────────────────────────────

  async addManager(communityId: string, phoneNumber: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const user = await this.prisma.user.upsert({
      where: { phone_number: phoneNumber },
      update: {},
      create: { phone_number: phoneNumber, role_type: 'user', status: 'invited' },
    });

    const existing = await this.prisma.membership.findFirst({
      where: {
        user_id: user.id,
        community_id: communityId,
        role_type: { in: [RoleType.Manager, RoleType.CommunityAdmin, RoleType.CommunityManager] },
      },
    });
    if (existing) throw new ConflictException('User is already a manager');

    const membership = await this.prisma.membership.create({
      data: {
        user_id: user.id,
        community_id: communityId,
        role_type: RoleType.CommunityManager,
        approval_status: ApprovalStatus.Approved,
      },
    });

    // Send WhatsApp welcome message (fire-and-forget)
    this.sendWelcomeMessage(phoneNumber, community.name).catch(err =>
      this.logger.warn(`Failed to send welcome WhatsApp to ${phoneNumber}: ${err.message}`),
    );

    return membership;
  }

  // ─── Users (super admin) ───────────────────────────────────────────────────

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        phone_number: true,
        full_name: true,
        status: true,
        role_type: true,
        created_at: true,
        memberships: {
          select: {
            id: true,
            role_type: true,
            approval_status: true,
            community: { select: { id: true, name: true } },
            unit: { select: { unit_code: true } },
          },
        },
      },
    });
  }

  async updateUserRole(userId: string, roleType: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { role_type: roleType } });
  }

  async resendInvite(membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: { select: { phone_number: true, status: true } },
        community: { select: { name: true } },
      },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    await this.sendWelcomeMessage(membership.user.phone_number, membership.community.name);
    return { message: 'Invite resent' };
  }

  // ─── WhatsApp Welcome ──────────────────────────────────────────────────────

  private async sendWelcomeMessage(phoneNumber: string, communityName: string): Promise<void> {
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    const templateSid = this.config.get<string>('TWILIO_WELCOME_TEMPLATE_SID');

    if (templateSid) {
      // Use approved template (recommended for cold numbers)
      await this.twilioClient.messages.create({
        from,
        to: `whatsapp:${phoneNumber}`,
        contentSid: templateSid,
        contentVariables: JSON.stringify({ 1: communityName }),
      });
    } else {
      // Freeform fallback — works only if the number has messaged this WhatsApp number before
      await this.twilioClient.messages.create({
        from,
        to: `whatsapp:${phoneNumber}`,
        body: `You are now a member of "${communityName}". Download Simsim app and login with your phone number to access your community.`,
      });
    }

    this.logger.log(`Welcome WhatsApp sent to ${phoneNumber} for community "${communityName}"`);
  }
}
