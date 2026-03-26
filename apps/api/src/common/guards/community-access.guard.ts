import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalRoleType, RoleType } from '@simsim/types';

/** Routes decorated with @RequireCommunityAdmin() require community_admin role.
 *  Without it, community_manager (and legacy manager) is also accepted. */
export const REQUIRE_COMMUNITY_ADMIN_ONLY = 'require_community_admin_only';
export const RequireCommunityAdmin = () =>
  SetMetadata(REQUIRE_COMMUNITY_ADMIN_ONLY, true);

/**
 * Validates that the authenticated user has an approved admin or manager
 * membership in the specific community being accessed.
 *
 * communityId is resolved from (in order):
 *   1. request.params.communityId
 *   2. request.body.community_id
 *
 * Super admins always pass. No extra DB query is needed — memberships are
 * already loaded on the user object by JwtStrategy.
 */
@Injectable()
export class CommunityAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Authentication required');

    // Super admins bypass all community-level checks
    if (user.role_type === GlobalRoleType.SuperAdmin) return true;

    const communityId =
      request.params?.communityId ?? request.body?.community_id;

    if (!communityId) {
      throw new ForbiddenException('Community context required');
    }

    const adminOnly = this.reflector.get<boolean>(
      REQUIRE_COMMUNITY_ADMIN_ONLY,
      context.getHandler(),
    );

    const allowedRoles: string[] = adminOnly
      ? [RoleType.CommunityAdmin]
      : [RoleType.CommunityAdmin, RoleType.CommunityManager, RoleType.Manager];

    const hasAccess = user.memberships?.some(
      (m: { community_id: string; role_type: string; approval_status: string }) =>
        m.community_id === communityId &&
        allowedRoles.includes(m.role_type) &&
        m.approval_status === 'approved',
    );

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this community');
    }

    return true;
  }
}
