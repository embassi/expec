import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { ScannerAuthGuard } from '../common/guards/scanner-auth.guard';

@Module({
  imports: [JwtModule],
  controllers: [ScannerController],
  providers: [ScannerService, ScannerAuthGuard],
})
export class ScannerModule {}
