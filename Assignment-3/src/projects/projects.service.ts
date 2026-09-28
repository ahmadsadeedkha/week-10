import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Project } from '../entities/Project.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { User } from '../entities/User.js';
import { ProjectMember } from '../entities/ProjectMember.js';
import { ProjectRole } from '../entities/Enums.js';
import { AddMemberDto } from './dto/add-member.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProjectDto, ownerId: number): Promise<Project> {
    const owner = await this.userRepo.findOneBy({ id: ownerId });
    if (!owner) {
      throw new NotFoundException(`User ${ownerId} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      const project = manager.create(Project, {
        name: dto.name,
        owner,
      });
      const savedProject = await manager.save(project);

      const membership = manager.create(ProjectMember, {
        user_id: ownerId,
        project_id: savedProject.id,
        role: ProjectRole.OWNER,
      });
      await manager.save(membership);

      return savedProject;
    });
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepo.find();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepo.findOneBy({ id });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    if (dto.name !== undefined) {
      project.name = dto.name;
    }
    return this.projectRepo.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }

  async addMember(
    projectId: number,
    dto: AddMemberDto,
  ): Promise<ProjectMember> {
    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const existing = await this.projectMemberRepo.findOne({
      where: { project_id: projectId, user_id: dto.userId },
    });
    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} is already a member of project ${projectId}`,
      );
    }

    const membership = this.projectMemberRepo.create({
      project_id: projectId,
      user_id: dto.userId,
      role: dto.role,
    });
    return this.projectMemberRepo.save(membership);
  }
}
