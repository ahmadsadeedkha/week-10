import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/Task.js';
import { Comment } from '../entities/Comment.js';
import { CreateCommentDto } from '../comments/dto/create-comment.dto.js';
import { CommentsService } from '../comments/comments.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { Project } from '../entities/Project.js';

interface TaskFilters {
  status?: string;
  projectId?: number;
  assigneeId?: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly commentsService: CommentsService,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const project = await this.projectRepo.findOneBy({ id: dto.projectId });
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      project,
      status: dto.status,
    });
    return this.taskRepo.save(task);
  }

  async findAll(filters: TaskFilters, page = 1, pageSize = 10) {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee');

    if (filters.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.projectId !== undefined) {
      qb.andWhere('project.id = :projectId', { projectId: filters.projectId });
    }
    if (filters.assigneeId !== undefined) {
      qb.andWhere('assignee.id = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }
    const take = Math.min(pageSize, 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();

    return { items, total, page: Math.max(page, 1), pageSize: take };
  }

  async findOne(id: number): Promise<Task & { commentCount: number }> {
    const result = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)', 'count')
          .from('comments', 'comment')
          .where('comment.task_id = task.id');
      }, 'commentCount')
      .where('task.id = :id', { id })
      .getRawAndEntities();

    const task = result.entities[0];
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    const commentCount = parseInt(result.raw[0].commentCount, 10);

    return { ...task, commentCount };
  }

  async getComments(taskId: number, page = 1, pageSize = 10) {
    await this.findOne(taskId); // 404s if the task doesn't exist
    return this.commentsService.findAllForTask(taskId, page, pageSize);
  }

  async addComment(
    taskId: number,
    dto: CreateCommentDto,
    authorId: number,
  ): Promise<Comment> {
    const task = await this.findOne(taskId); // 404s if the task doesn't exist
    return this.commentsService.createForTask(dto, task, authorId);
  }
}
