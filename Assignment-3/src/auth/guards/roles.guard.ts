import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../../entities/ProjectMember.js';
import { Task } from '../../entities/Task.js';
import { ProjectRole } from '../../entities/Enums.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import {
  PROJECT_SOURCE_KEY,
  ProjectSource,
} from '../decorators/project-source.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // route doesn't declare @Roles(), nothing to enforce
    }

    const projectSource = this.reflector.getAllAndOverride<ProjectSource>(
      PROJECT_SOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!projectSource) {
      throw new Error(
        'RolesGuard: route uses @Roles() but has no @ProjectSourceFrom() — cannot resolve project id',
      );
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // set by JwtAuthGuard — must run before this guard

    const projectId = await this.resolveProjectId(projectSource, request);

    const membership = await this.projectMemberRepo.findOne({
      where: { project_id: projectId, user_id: user.userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }

    return true;
  }

  private async resolveProjectId(
    source: ProjectSource,
    request: any,
  ): Promise<number> {
    switch (source.type) {
      case 'route-param': {
        const value = request.params[source.param];
        return Number(value);
      }

      case 'body-field': {
        const value = request.body?.[source.field];
        if (value === undefined) {
          throw new ForbiddenException(
            `Missing ${source.field} in request body`,
          );
        }
        return Number(value);
      }

      case 'task-param': {
        const taskId = Number(request.params[source.param]);
        const task = await this.taskRepo.findOne({ where: { id: taskId } });
        if (!task) {
          throw new ForbiddenException('Referenced task does not exist');
        }
        return task.project_id;
      }
    }
  }
}
