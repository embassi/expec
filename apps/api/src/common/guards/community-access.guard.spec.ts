import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CommunityAccessGuard,
  REQUIRE_COMMUNITY_ADMIN_ONLY,
} from './community-access.guard';
import { GlobalRoleType, RoleType } from '@simsim/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(
  user: any,
  params: Record<string, string> = {},
  body: Record<string, string> = {},
  handlerMetadata: any = undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params, body }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
    // Used by Reflector.get() to get REQUIRE_COMMUNITY_ADMIN_ONLY
    _handlerMetadata: handlerMetadata,
  } as unknown as ExecutionContext;
}

function makeReflector(adminOnly = false): Reflector {
  return {
    get: jest.fn().mockReturnValue(adminOnly),
  } as unknown as Reflector;
}

function makeUser(
  roleType: string,
  memberships: Array<{ community_id: string; role_type: string; approval_status: string }> = [],
) {
  return { id: 'user-1', role_type: roleType, memberships };
}

const COMMUNITY_ID = 'community-abc';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CommunityAccessGuard', () => {
  it('allows super_admin without checking memberships', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const ctx = makeCtx(
      makeUser(GlobalRoleType.SuperAdmin),
      { communityId: COMMUNITY_ID },
    );

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows user with approved community_admin membership', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.CommunityAdmin, approval_status: 'approved' },
    ]);

    expect(guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toBe(true);
  });

  it('allows user with approved community_manager membership', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.CommunityManager, approval_status: 'approved' },
    ]);

    expect(guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toBe(true);
  });

  it('denies user whose membership is for a different community', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: 'other-community', role_type: RoleType.CommunityAdmin, approval_status: 'approved' },
    ]);

    expect(() => guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies user with pending (unapproved) membership', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.CommunityAdmin, approval_status: 'pending' },
    ]);

    expect(() => guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies resident-role membership from accessing admin routes', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.Resident, approval_status: 'approved' },
    ]);

    expect(() => guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toThrow(
      ForbiddenException,
    );
  });

  it('reads communityId from request body when not in params', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.CommunityAdmin, approval_status: 'approved' },
    ]);

    // communityId is in body, not params
    expect(guard.canActivate(makeCtx(user, {}, { community_id: COMMUNITY_ID }))).toBe(true);
  });

  it('throws when communityId is absent and user is not super_admin', () => {
    const guard = new CommunityAccessGuard(makeReflector());
    const user = makeUser('user', [
      { community_id: COMMUNITY_ID, role_type: RoleType.CommunityAdmin, approval_status: 'approved' },
    ]);

    // No communityId in params or body
    expect(() => guard.canActivate(makeCtx(user))).toThrow(ForbiddenException);
  });

  describe('when @RequireCommunityAdmin() is set', () => {
    it('denies community_manager when admin-only is required', () => {
      const guard = new CommunityAccessGuard(makeReflector(true)); // adminOnly = true
      const user = makeUser('user', [
        { community_id: COMMUNITY_ID, role_type: RoleType.CommunityManager, approval_status: 'approved' },
      ]);

      expect(() => guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toThrow(
        ForbiddenException,
      );
    });

    it('allows community_admin when admin-only is required', () => {
      const guard = new CommunityAccessGuard(makeReflector(true));
      const user = makeUser('user', [
        { community_id: COMMUNITY_ID, role_type: RoleType.CommunityAdmin, approval_status: 'approved' },
      ]);

      expect(guard.canActivate(makeCtx(user, { communityId: COMMUNITY_ID }))).toBe(true);
    });
  });
});
