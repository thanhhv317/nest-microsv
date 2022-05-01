import { Module } from '@nestjs/common';
import { TracingService } from './tracer';

@Module({
  controllers: [],
  providers: [TracingService],
  exports: [TracingService],
})
export class TracerModule {}
