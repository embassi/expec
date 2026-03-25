import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GuestPassesService } from './guest-passes.service';
import { GuestPassesController } from './guest-passes.controller';

@Module({
  imports: [JwtModule],
  controllers: [GuestPassesController],
  providers: [GuestPassesService],
})
export class GuestPassesModule {}
