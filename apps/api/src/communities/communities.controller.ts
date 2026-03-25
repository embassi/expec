import { Controller, Get, Post, Body } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { RequestJoinDto } from './dto/request-join.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('communities')
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Get('my')
  getMyCommunities(@CurrentUser() user: User) {
    return this.communitiesService.getMyCommunities(user.id);
  }

  @Post('request-join')
  requestJoin(@CurrentUser() user: User, @Body() dto: RequestJoinDto) {
    return this.communitiesService.requestJoin(user.id, dto);
  }
}
