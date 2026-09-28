import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  controllers: [TeamController, AdminController],
  providers: [AdminService, TeamService],
  exports: [AdminService],
})
export class AdminModule {}
