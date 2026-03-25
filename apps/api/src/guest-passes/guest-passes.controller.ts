import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { GuestPassesService } from './guest-passes.service';
import { CreateGuestPassDto } from './dto/create-guest-pass.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '@prisma/client';

@Controller('guest-passes')
export class GuestPassesController {
  constructor(private guestPassesService: GuestPassesService) {}

  @Post()
  createPass(@CurrentUser() user: User, @Body() dto: CreateGuestPassDto) {
    return this.guestPassesService.createPass(user.id, dto);
  }

  @Get('my')
  getMyPasses(@CurrentUser() user: User) {
    return this.guestPassesService.getMyPasses(user.id);
  }

  @Delete(':id')
  cancelPass(@CurrentUser() user: User, @Param('id') id: string) {
    return this.guestPassesService.cancelPass(user.id, id);
  }

  // Public — no auth — accessed by guest via WhatsApp link
  @Public()
  @Get('view/:token')
  getPassQrData(@Param('token') token: string) {
    return this.guestPassesService.getPassQrData(token);
  }
}
