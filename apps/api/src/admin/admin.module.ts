import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CommunityAdminGuard } from '../common/guards/community-admin.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminGuard, CommunityAdminGuard],
})
export class AdminModule {}
