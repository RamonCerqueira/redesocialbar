import { Module } from '@nestjs/common';
import { FlirtService } from './flirt.service';
import { FlirtController } from './flirt.controller';

@Module({
  controllers: [FlirtController],
  providers: [FlirtService],
  exports: [FlirtService],
})
export class FlirtModule {}
