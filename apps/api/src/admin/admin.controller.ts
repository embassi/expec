import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Header,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CommunityAdminGuard } from '../common/guards/community-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { AssignOwnerDto } from './dto/assign-owner.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { User } from '@prisma/client';
import { Matches } from 'class-validator';

class AddManagerDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_number must be in international format, e.g. +201001234567' })
  phone_number: string;
}

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Overview ────────────────────────────────────────────────────────────

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  // ─── Communities ─────────────────────────────────────────────────────────

  @Post('communities')
  createCommunity(@Body() dto: CreateCommunityDto) {
    return this.adminService.createCommunity(dto);
  }

  @Get('communities')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  listCommunities() {
    return this.adminService.listCommunities();
  }

  // ─── Units ───────────────────────────────────────────────────────────────

  @Post('units')
  createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: User) {
    return this.adminService.createUnit(dto, user.id);
  }

  @Get('communities/:communityId/units')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  listUnits(@Param('communityId') communityId: string) {
    return this.adminService.listUnits(communityId);
  }

  @Post('communities/:communityId/assign-owner')
  assignOwner(
    @Param('communityId') communityId: string,
    @Body() dto: AssignOwnerDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.assignOwner(communityId, dto, user.id);
  }

  // ─── Memberships ─────────────────────────────────────────────────────────

  @Get('communities/:communityId/memberships')
  listMemberships(
    @Param('communityId') communityId: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listMemberships(communityId, status);
  }

  @Patch('memberships/:id')
  updateMembership(@Param('id') id: string, @Body() dto: UpdateMembershipStatusDto) {
    return this.adminService.updateMembershipStatus(id, dto);
  }

  // ─── Scanners ────────────────────────────────────────────────────────────

  @Post('scanners')
  createScanner(@Body() dto: CreateScannerDto) {
    return this.adminService.createScanner(dto);
  }

  @Get('communities/:communityId/scanners')
  listScanners(@Param('communityId') communityId: string) {
    return this.adminService.listScanners(communityId);
  }

  @Patch('scanners/:id/toggle')
  toggleScanner(@Param('id') id: string) {
    return this.adminService.toggleScanner(id);
  }

  // ─── Announcements ───────────────────────────────────────────────────────

  @Post('announcements')
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: User) {
    return this.adminService.createAnnouncement(dto, user.id);
  }

  @Get('communities/:communityId/announcements')
  listAnnouncements(@Param('communityId') communityId: string) {
    return this.adminService.listAnnouncements(communityId);
  }

  // ─── Access Logs ─────────────────────────────────────────────────────────

  @Get('communities/:communityId/access-logs')
  getAccessLogs(
    @Param('communityId') communityId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.adminService.getAccessLogs(communityId, limit, offset);
  }

  // ─── Policies ────────────────────────────────────────────────────────────

  @Get('communities/:communityId/policy')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  getPolicy(@Param('communityId') communityId: string) {
    return this.adminService.getPolicy(communityId);
  }

  @Patch('communities/:communityId/policy')
  updatePolicy(@Param('communityId') communityId: string, @Body() dto: UpdatePolicyDto) {
    return this.adminService.updatePolicy(communityId, dto);
  }

  // ─── Service Requests ────────────────────────────────────────────────────

  @Get('communities/:communityId/service-requests')
  listServiceRequests(
    @Param('communityId') communityId: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listServiceRequests(communityId, status);
  }

  @Patch('service-requests/:id/status')
  updateServiceRequestStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateServiceRequestStatus(id, status);
  }

  // ─── Managers ────────────────────────────────────────────────────────────

  @Post('communities/:communityId/managers')
  addManager(
    @Param('communityId') communityId: string,
    @Body() dto: AddManagerDto,
  ) {
    return this.adminService.addManager(communityId, dto.phone_number);
  }

  // ─── Users (super admin only) ─────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @UseGuards(SuperAdminGuard)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role_type') roleType: string) {
    return this.adminService.updateUserRole(id, roleType);
  }

  // ─── Resend Invite ────────────────────────────────────────────────────────

  @UseGuards(CommunityAdminGuard)
  @Post('memberships/:id/resend-invite')
  resendInvite(@Param('id') id: string) {
    return this.adminService.resendInvite(id);
  }

  // ─── Assign Scanner ───────────────────────────────────────────────────────

  @UseGuards(CommunityAdminGuard)
  @Patch('scanners/:id/assign')
  assignScanner(
    @Param('id') id: string,
    @Body('phone_number') phoneNumber: string | null,
  ) {
    return this.adminService.assignScanner(id, phoneNumber ?? null);
  }
}
