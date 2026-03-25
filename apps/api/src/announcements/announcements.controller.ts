import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnnouncementStatus } from '@simsim/types';

@Controller('communities')
export class AnnouncementsController {
  constructor(private prisma: PrismaService) {}

  @Get(':communityId/announcements')
  async getAnnouncements(@Param('communityId') communityId: string) {
    return this.prisma.announcement.findMany({
      where: {
        community_id: communityId,
        status: AnnouncementStatus.Published,
      },
      orderBy: { published_at: 'desc' },
    });
  }
}
