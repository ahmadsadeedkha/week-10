import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module.js';
import { Task } from '../entities/Task.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksWriteController } from './tasks-write.controller.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectMember } from '../entities/ProjectMember.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, ProjectMember]),
    CommentsModule,
    ProjectsModule,
    AuthModule,
  ],
  controllers: [TasksController, TasksWriteController],
  providers: [TasksService],
})
export class TasksModule {}
