import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/Project.js';
import { ProjectsService } from './projects.service.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsWriteController } from './projects-write.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { Task } from '../entities/Task.js';
import { ProjectMember } from '../entities/ProjectMember.js';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, ProjectMember]), UsersModule, AuthModule],
  controllers: [ProjectsController, ProjectsWriteController],
  providers: [ProjectsService],
  exports: [TypeOrmModule],
})
export class ProjectsModule {}
