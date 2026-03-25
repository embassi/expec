import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
