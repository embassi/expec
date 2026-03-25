import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';

@Module({
  controllers: [ServiceRequestsController],
})
export class ServiceRequestsModule {}
