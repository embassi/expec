import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessLogsService {
  constructor(private prisma: PrismaService) {}

  async getLogsForCommunity(
    communityId: string,
    limit = 50,
    offset = 0,
  ) {
    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { community_id: communityId },
        orderBy: { scanned_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.accessLog.count({ where: { community_id: communityId } }),
    ]);

    return { logs, total, limit, offset };
  }
}
