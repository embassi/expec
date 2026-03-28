import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string; // auth.users.id — linked to public.users.auth_user_id
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
    // Supabase JWT sub = auth.users.id, linked to public.users via auth_user_id column.
    const user = await this.prisma.user.findFirst({
      where: { auth_user_id: payload.sub },
      include: {
        memberships: {
          select: { role_type: true, community_id: true, approval_status: true },
        },
      },
    });

    if (!user || (user.status !== 'active' && user.status !== 'invited')) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
