import { Controller, Get, Param, Query } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':id')
  findOne(@Param('id', PositiveIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Get(':id/comments')
  findComments(
    @Param('id', PositiveIntPipe) id: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasksService.getComments(
      id,
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
    );
  }
}
