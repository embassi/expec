import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateServiceRequestDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { user_id: user.id, community_id: dto.community_id, approval_status: 'approved' },
    });

    return this.prisma.serviceRequest.create({
      data: {
        community_id: dto.community_id,
        user_id: user.id,
        membership_id: membership?.id,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
      },
    });
  }

  @Get('my')
  async getMyRequests(@CurrentUser() user: User) {
    return this.prisma.serviceRequest.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });
  }
}
