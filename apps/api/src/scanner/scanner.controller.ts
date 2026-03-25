import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ValidateResidentDto } from './dto/validate-resident.dto';
import { ValidatePassDto } from './dto/validate-pass.dto';
import { ScannerAuthGuard } from '../common/guards/scanner-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Public()
@UseGuards(ScannerAuthGuard)
@Controller('scanner')
export class ScannerController {
  constructor(private scannerService: ScannerService) {}

  @Post('validate-resident')
  validateResident(@Req() req: any, @Body() dto: ValidateResidentDto) {
    return this.scannerService.validateResident(req.scanner, dto.qr_token);
  }

  @Post('validate-pass')
  validatePass(@Req() req: any, @Body() dto: ValidatePassDto) {
    return this.scannerService.validatePass(req.scanner, dto.pass_token);
  }
}
