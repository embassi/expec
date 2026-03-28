import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
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
    const supabaseUrl = config.get<string>('SUPABASE_URL');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use Supabase JWKS endpoint so verification works for both RS256 and HS256
      // regardless of which JWT signing key the project uses.
      ...(supabaseUrl
        ? {
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 10,
              jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),
          }
        : {
            secretOrKey: config.get<string>('JWT_SECRET'),
          }),
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

    // 2. Fallback: find by email/phone from JWT claims, then auto-link
    if (!user) {
      const orConditions: { email?: string; phone_number?: string; id?: string }[] = [];
      if (payload.email) orConditions.push({ email: payload.email });
      if (payload.phone) orConditions.push({ phone_number: payload.phone });
      orConditions.push({ id: payload.sub });

      user = await this.prisma.user.findFirst({
        where: { OR: orConditions },
        include: {
          memberships: {
            select: { role_type: true, community_id: true, approval_status: true },
          },
        },
      });

      if (user && !user.auth_user_id) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { auth_user_id: payload.sub },
        }).catch(() => null);
      }
    }

    if (!user || (user.status !== 'active' && user.status !== 'invited')) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
