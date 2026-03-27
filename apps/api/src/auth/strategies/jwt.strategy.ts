import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Supabase JWTs are signed with the project JWT secret.
      // Falls back to JWT_SECRET for local dev / legacy tokens.
      secretOrKey: config.get<string>('SUPABASE_JWT_SECRET') ?? config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // 1. Try to find by Supabase auth_user_id (fast path after first login)
    let user = await this.prisma.user.findUnique({
      where: { auth_user_id: payload.sub },
      include: {
        memberships: {
          select: { role_type: true, community_id: true, approval_status: true },
        },
      },
    });

    // 2. Legacy fallback: sub is our internal user UUID (old JWT_SECRET tokens)
    //    or user hasn't linked auth_user_id yet — find by email/phone from claims
    if (!user) {
      const orConditions: { email?: string; phone_number?: string; id?: string }[] = [];
      if (payload.email) orConditions.push({ email: payload.email });
      if (payload.phone) orConditions.push({ phone_number: payload.phone });
      // Also try treating sub as our internal UUID (legacy tokens)
      orConditions.push({ id: payload.sub });

      user = await this.prisma.user.findFirst({
        where: { OR: orConditions },
        include: {
          memberships: {
            select: { role_type: true, community_id: true, approval_status: true },
          },
        },
      });

      // Auto-link auth_user_id so next request uses the fast path
      if (user && !user.auth_user_id) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { auth_user_id: payload.sub },
        }).catch(() => null); // ignore if sub is not a valid UUID
      }
    }

    if (!user || (user.status !== 'active' && user.status !== 'invited')) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
