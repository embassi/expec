import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleType } from '@simsim/types';

@Injectable()
export class ScannerAuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // ── Mode 1: User JWT (gatekeeper login) ─────────────────────────────────
    if (authHeader?.startsWith('Bearer ')) {
      return this.authenticateByUserToken(request, authHeader.slice(7));
    }

    // ── Mode 2: Scanner credentials ──────────────────────────────────────────
    return this.authenticateByCredentials(request);
  }

  private async authenticateByUserToken(request: any, token: string): Promise<boolean> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { role_type: RoleType.Gatekeeper, approval_status: 'approved' },
        },
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.memberships.length) {
      throw new UnauthorizedException('User is not a gatekeeper in any community');
    }

    // Find scanner assigned to this user
    const scanner = await this.prisma.scanner.findFirst({
      where: { assigned_user_id: user.id, is_active: true },
    });

    if (!scanner) {
      throw new UnauthorizedException('No active scanner assigned to this user');
    }

    request.scanner = scanner;
    return true;
  }

  private async authenticateByCredentials(request: any): Promise<boolean> {
    const scannerCode = request.headers['x-scanner-code'];
    const deviceKey = request.headers['x-device-key'];

    if (!scannerCode || !deviceKey) {
      throw new UnauthorizedException('Scanner credentials required');
    }

    const scanner = await this.prisma.scanner.findUnique({
      where: { scanner_code: scannerCode },
    });

    if (!scanner || scanner.device_key !== deviceKey || !scanner.is_active) {
      throw new UnauthorizedException('Invalid scanner credentials');
    }

    request.scanner = scanner;
    return true;
  }
}
