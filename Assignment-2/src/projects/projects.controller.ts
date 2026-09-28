import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', PositiveIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }
}
