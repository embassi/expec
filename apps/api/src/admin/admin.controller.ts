import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CommunityAccessGuard, RequireCommunityAdmin } from '../common/guards/community-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { AssignOwnerDto } from './dto/assign-owner.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { CreateScannerDto } from './dto/create-scanner.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { ListMembershipsDto } from './dto/list-memberships.dto';
import { ListServiceRequestsDto } from './dto/list-service-requests.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { ListAccessLogsDto } from './dto/list-access-logs.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { User } from '@prisma/client';
import { Matches } from 'class-validator';

class AddManagerDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_number must be in international format, e.g. +201001234567' })
  phone_number: string;
}

/**
 * Route permission matrix:
 *
 * SuperAdmin only:
 *   GET   /admin/overview
 *   POST  /admin/communities
 *   GET   /admin/communities
 *   GET   /admin/users
 *   PATCH /admin/users/:id/role
 *
 * Community admin or manager (scoped to target community):
 *   POST  /admin/units                                    (body.community_id)
 *   GET   /admin/communities/:communityId/units
 *   GET   /admin/communities/:communityId/memberships
 *   GET   /admin/communities/:communityId/scanners
 *   POST  /admin/announcements                            (body.community_id)
 *   GET   /admin/communities/:communityId/announcements
 *   GET   /admin/communities/:communityId/access-logs
 *   GET   /admin/communities/:communityId/policy
 *   GET   /admin/communities/:communityId/service-requests
 *
 * Community admin only (scoped to target community):
 *   POST  /admin/communities/:communityId/assign-owner
 *   POST  /admin/scanners                                 (body.community_id)
 *   PATCH /admin/communities/:communityId/policy
 *   POST  /admin/communities/:communityId/managers
 *
 * Admin or manager — indirect community (service resolves + validates):
 *   PATCH /admin/memberships/:id
 *   PATCH /admin/scanners/:id/toggle
 *   PATCH /admin/service-requests/:id/status
 *   POST  /admin/memberships/:id/resend-invite
 *   PATCH /admin/scanners/:id/assign
 */
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Overview (super admin only) ─────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  // ─── Communities (super admin only) ──────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Post('communities')
  createCommunity(@Body() dto: CreateCommunityDto) {
    return this.adminService.createCommunity(dto);
  }

  @UseGuards(SuperAdminGuard)
  @Get('communities')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  listCommunities() {
    return this.adminService.listCommunities();
  }

  // ─── Units ───────────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Post('units')
  createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: User) {
    return this.adminService.createUnit(dto, user.id);
  }

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/units')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  listUnits(@Param('communityId') communityId: string) {
    return this.adminService.listUnits(communityId);
  }

  @UseGuards(CommunityAccessGuard)
  @RequireCommunityAdmin()
  @Post('communities/:communityId/assign-owner')
  assignOwner(
    @Param('communityId') communityId: string,
    @Body() dto: AssignOwnerDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.assignOwner(communityId, dto, user.id);
  }

  // ─── Memberships ─────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/memberships')
  listMemberships(
    @Param('communityId') communityId: string,
    @Query() query: ListMembershipsDto,
  ) {
    return this.adminService.listMemberships(communityId, query);
  }

  /** communityId resolved from membership record — service validates access */
  @Patch('memberships/:id')
  updateMembership(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateMembershipStatus(id, dto, user);
  }

  // ─── Scanners ────────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @RequireCommunityAdmin()
  @Post('scanners')
  createScanner(@Body() dto: CreateScannerDto) {
    return this.adminService.createScanner(dto);
  }

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/scanners')
  listScanners(@Param('communityId') communityId: string) {
    return this.adminService.listScanners(communityId);
  }

  /** communityId resolved from scanner record — service validates access */
  @Patch('scanners/:id/toggle')
  toggleScanner(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adminService.toggleScanner(id, user);
  }

  // ─── Announcements ───────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Post('announcements')
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: User) {
    return this.adminService.createAnnouncement(dto, user.id);
  }

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/announcements')
  listAnnouncements(
    @Param('communityId') communityId: string,
    @Query() query: ListAnnouncementsDto,
  ) {
    return this.adminService.listAnnouncements(communityId, query);
  }

  // ─── Access Logs ─────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/access-logs')
  getAccessLogs(
    @Param('communityId') communityId: string,
    @Query() query: ListAccessLogsDto,
  ) {
    return this.adminService.getAccessLogs(communityId, query);
  }

  // ─── Policies ────────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/policy')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  getPolicy(@Param('communityId') communityId: string) {
    return this.adminService.getPolicy(communityId);
  }

  @UseGuards(CommunityAccessGuard)
  @RequireCommunityAdmin()
  @Patch('communities/:communityId/policy')
  updatePolicy(@Param('communityId') communityId: string, @Body() dto: UpdatePolicyDto) {
    return this.adminService.updatePolicy(communityId, dto);
  }

  // ─── Service Requests ────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @Get('communities/:communityId/service-requests')
  listServiceRequests(
    @Param('communityId') communityId: string,
    @Query() query: ListServiceRequestsDto,
  ) {
    return this.adminService.listServiceRequests(communityId, query);
  }

  /** communityId resolved from service request record — service validates access */
  @Patch('service-requests/:id/status')
  updateServiceRequestStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateServiceRequestStatus(id, status, user);
  }

  // ─── Managers ────────────────────────────────────────────────────────────

  @UseGuards(CommunityAccessGuard)
  @RequireCommunityAdmin()
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
  listUsers(@Query() query: ListUsersDto) {
    return this.adminService.listUsers(query);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role_type') roleType: string) {
    return this.adminService.updateUserRole(id, roleType);
  }

  @UseGuards(SuperAdminGuard)
  @Get('users/:id/activity')
  getUserActivity(@Param('id') id: string) {
    return this.adminService.getUserActivity(id);
  }

  // ─── Resend Invite ────────────────────────────────────────────────────────

  /** communityId resolved from membership record — service validates access */
  @Post('memberships/:id/resend-invite')
  resendInvite(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adminService.resendInvite(id, user);
  }

  // ─── Assign Scanner ───────────────────────────────────────────────────────

  /** communityId resolved from scanner record — service validates access */
  @Patch('scanners/:id/assign')
  assignScanner(
    @Param('id') id: string,
    @Body('phone_number') phoneNumber: string | null,
    @CurrentUser() user: User,
  ) {
    return this.adminService.assignScanner(id, phoneNumber ?? null, user);
  }
}
