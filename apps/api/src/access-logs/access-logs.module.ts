import { Module } from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';

@Module({
  providers: [AccessLogsService],
  exports: [AccessLogsService],
})
export class AccessLogsModule {}
