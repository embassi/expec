import { Controller, Get } from '@nestjs/common';
import { QrService } from './qr.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('access')
export class QrController {
  constructor(private qrService: QrService) {}

  @Get('qr')
  getQrToken(@CurrentUser() user: User) {
    return this.qrService.generateResidentQrToken(user.id);
  }
}
