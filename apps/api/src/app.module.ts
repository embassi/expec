import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommunitiesModule } from './communities/communities.module';
import { MembershipsModule } from './memberships/memberships.module';
import { QrModule } from './qr/qr.module';
import { ScannerModule } from './scanner/scanner.module';
import { AccessLogsModule } from './access-logs/access-logs.module';
import { GuestPassesModule } from './guest-passes/guest-passes.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { AdminModule } from './admin/admin.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 120 },
    ]),
    PrismaModule,
    QueueModule,
    AuthModule,
    UsersModule,
    CommunitiesModule,
    MembershipsModule,
    QrModule,
    ScannerModule,
    AccessLogsModule,
    GuestPassesModule,
    AnnouncementsModule,
    ServiceRequestsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
