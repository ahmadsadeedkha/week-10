import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateCommentDto } from '../comments/dto/create-comment.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator.js';
import { ProjectRole } from '../entities/Enums.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ProjectSourceFrom } from '../auth/decorators/project-source.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe.js';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksWriteController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ProjectSourceFrom({ type: 'body-field', field: 'projectId' })
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Post(':id/comments')
  @UseGuards(RolesGuard)
  @Roles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  @ProjectSourceFrom({ type: 'task-param', param: 'id' })
  addComment(
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.addComment(id, dto, user.userId);
  }
}
