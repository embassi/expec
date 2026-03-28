import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;       // auth.users.id — NOT our public.users.id
  phone?: string;    // present in phone-auth JWTs
  email?: string;    // present in email-auth JWTs
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
    // Supabase JWT sub = auth.users.id, which is different from public.users.id.
    // Look up by phone_number or email from the JWT claims instead.
    const orConditions: { phone_number?: string; email?: string }[] = [];
    if (payload.phone) orConditions.push({ phone_number: payload.phone });
    if (payload.email) orConditions.push({ email: payload.email });

    if (orConditions.length === 0) throw new UnauthorizedException();

    const user = await this.prisma.user.findFirst({
      where: { OR: orConditions },
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
