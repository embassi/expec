import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScannerAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
