import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GlobalRoleType, RoleType } from '@simsim/types';

@Injectable()
export class CommunityAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Community admin access required');

    if (user.role_type === GlobalRoleType.SuperAdmin) return true;

    const hasCommunityAdmin = user.memberships?.some((m: any) =>
      m.role_type === RoleType.CommunityAdmin && m.approval_status === 'approved',
    );
    if (hasCommunityAdmin) return true;

    throw new ForbiddenException('Community admin access required');
  }
}
