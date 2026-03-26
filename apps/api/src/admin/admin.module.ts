import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CommunityAccessGuard } from '../common/guards/community-access.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminGuard, CommunityAccessGuard],
})
export class AdminModule {}
