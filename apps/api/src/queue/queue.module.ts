import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';

/** Global so any module can inject QueueService without re-importing QueueModule */
@Global()
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
