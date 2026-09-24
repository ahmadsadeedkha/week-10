import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ProjectRole } from '../entities/Enums.js';
import { ProjectSourceFrom } from '../auth/decorators/project-source.decorator.js';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe.js';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsWriteController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.create(dto, user.userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ProjectSourceFrom({ type: 'route-param', param: 'id' })
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ProjectSourceFrom({ type: 'route-param', param: 'id' })
  @HttpCode(204)
  remove(@Param('id', PositiveIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
