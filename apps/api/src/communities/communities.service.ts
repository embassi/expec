import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestJoinDto } from './dto/request-join.dto';
import { ApprovalStatus, RelationshipType } from '@simsim/types';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        approval_status: ApprovalStatus.Approved,
      },
      include: {
        community: true,
        unit: true,
      },
    });

    return memberships.map((m) => ({
      membership_id: m.id,
      community_id: m.community_id,
      name: m.community.name,
      slug: m.community.slug,
      type: m.community.type,
      unit_code: m.unit?.unit_code ?? null,
      unit_id: m.unit_id,
      relationship_type: m.relationship_type,
      role_type: m.role_type,
    }));
  }

  async requestJoin(userId: string, dto: RequestJoinDto) {
    // Check community exists
    const community = await this.prisma.community.findUnique({
      where: { id: dto.community_id },
    });
    if (!community) throw new NotFoundException('Community not found');

    // Find the unit
    const unit = await this.prisma.unit.findFirst({
      where: { community_id: dto.community_id, unit_code: dto.unit_code },
    });
    if (!unit) throw new NotFoundException('Unit not found in this community');

    // Check for existing membership
    const existing = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        community_id: dto.community_id,
        approval_status: { in: [ApprovalStatus.Pending, ApprovalStatus.Approved] },
      },
    });
    if (existing) {
      throw new BadRequestException('You already have a membership or pending request for this community');
    }

    const membership = await this.prisma.membership.create({
      data: {
        user_id: userId,
        community_id: dto.community_id,
        unit_id: unit.id,
        relationship_type: RelationshipType.Owner, // default, admin adjusts
        role_type: 'resident',
        approval_status: ApprovalStatus.Pending,
      },
    });

    return { message: 'Join request submitted', membership_id: membership.id };
  }
}
