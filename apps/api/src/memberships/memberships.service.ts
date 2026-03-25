import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { ApprovalStatus, RelationshipType, RoleType } from '@simsim/types';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  // Owner adds a household member (family/tenant/staff)
  async addMember(inviterUserId: string, dto: AddMemberDto) {
    // Verify inviter is an approved owner of the unit
    const inviterMembership = await this.prisma.membership.findFirst({
      where: {
        user_id: inviterUserId,
        community_id: dto.community_id,
        unit_id: dto.unit_id,
        relationship_type: RelationshipType.Owner,
        approval_status: ApprovalStatus.Approved,
      },
    });
    if (!inviterMembership) {
      throw new ForbiddenException('You must be an approved owner of this unit to add members');
    }

    // Get community policies
    const policy = await this.prisma.communityPolicy.findUnique({
      where: { community_id: dto.community_id },
    });

    // Validate limits
    await this.validateMemberLimits(dto, policy);

    // Upsert the invited user
    const invitedUser = await this.prisma.user.upsert({
      where: { phone_number: dto.phone_number },
      update: {},
      create: { phone_number: dto.phone_number },
    });

    // Check if already a member
    const existing = await this.prisma.membership.findFirst({
      where: {
        user_id: invitedUser.id,
        community_id: dto.community_id,
        unit_id: dto.unit_id,
        approval_status: { in: [ApprovalStatus.Pending, ApprovalStatus.Approved] },
      },
    });
    if (existing) {
      throw new BadRequestException('This person is already a member or has a pending request');
    }

    // Determine approval status based on policy
    const needsApproval =
      policy?.owner_added_members_require_approval ?? true;

    const membership = await this.prisma.membership.create({
      data: {
        user_id: invitedUser.id,
        community_id: dto.community_id,
        unit_id: dto.unit_id,
        relationship_type: dto.relationship_type,
        role_type: RoleType.Resident,
        approval_status: needsApproval ? ApprovalStatus.Pending : ApprovalStatus.Approved,
        invited_by_user_id: inviterUserId,
      },
    });

    return {
      membership_id: membership.id,
      approval_status: membership.approval_status,
      message: needsApproval
        ? 'Member added and pending admin approval'
        : 'Member added and approved',
    };
  }

  async getMyMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { user_id: userId },
      include: { community: true, unit: true },
    });
  }

  private async validateMemberLimits(dto: AddMemberDto, policy: any) {
    if (!policy) return;

    const countWhere = {
      community_id: dto.community_id,
      unit_id: dto.unit_id,
      approval_status: { in: [ApprovalStatus.Pending, ApprovalStatus.Approved] },
    };

    if (dto.relationship_type === RelationshipType.Family) {
      const count = await this.prisma.membership.count({
        where: { ...countWhere, relationship_type: RelationshipType.Family },
      });
      if (count >= (policy.max_family_members_per_unit ?? 6)) {
        throw new BadRequestException('Family member limit reached for this unit');
      }
    }

    if (dto.relationship_type === RelationshipType.Staff) {
      const count = await this.prisma.membership.count({
        where: { ...countWhere, relationship_type: RelationshipType.Staff },
      });
      if (count >= (policy.max_staff_members_per_unit ?? 3)) {
        throw new BadRequestException('Staff member limit reached for this unit');
      }
    }

    if (dto.relationship_type === RelationshipType.Tenant && !policy.allow_tenants) {
      throw new BadRequestException('This community does not allow tenants');
    }
  }
}
