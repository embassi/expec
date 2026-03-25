import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GlobalRoleType, RoleType } from '@simsim/types';

const DASHBOARD_ROLES = [
  RoleType.CommunityAdmin,
  RoleType.CommunityManager,
  // Legacy
  RoleType.Manager,
];

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Admin access required');

    // Super admins always pass
    if (user.role_type === GlobalRoleType.SuperAdmin) return true;

    // Users with community_admin or community_manager membership pass
    const hasDashboardMembership = user.memberships?.some((m: any) =>
      DASHBOARD_ROLES.includes(m.role_type) && m.approval_status === 'approved',
    );
    if (hasDashboardMembership) return true;

    throw new ForbiddenException('Admin access required');
  }
}
