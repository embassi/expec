import { Controller, Post, Get, Body } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('memberships')
export class MembershipsController {
  constructor(private membershipsService: MembershipsService) {}

  @Post('add-member')
  addMember(@CurrentUser() user: User, @Body() dto: AddMemberDto) {
    return this.membershipsService.addMember(user.id, dto);
  }

  @Get('my')
  getMyMemberships(@CurrentUser() user: User) {
    return this.membershipsService.getMyMemberships(user.id);
  }
}
