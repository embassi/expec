import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GlobalRoleType } from '@simsim/types';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role_type !== GlobalRoleType.SuperAdmin) {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
