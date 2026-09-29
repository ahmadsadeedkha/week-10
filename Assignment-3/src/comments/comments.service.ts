import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/Comment.js';
import { Task } from '../entities/Task.js';
import { User } from '../entities/User.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAllForTask(taskId: number, page = 1, pageSize = 10) {
    const take = Math.min(pageSize, 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await this.commentRepo.findAndCount({
      where: { task: { id: taskId } },
      skip,
      take,
      order: { created_at: 'ASC' },
    });

    return { items, total, page: Math.max(page, 1), pageSize: take };
  }

  async createForTask(
    dto: CreateCommentDto,
    task: Task,
    authorId: number,
  ): Promise<Comment> {
    const author = await this.userRepo.findOneBy({ id: authorId });
    if (!author) {
      throw new NotFoundException(`User ${authorId} not found`);
    }

    const comment = this.commentRepo.create({
      body: dto.body,
      task,
      author,
    });
    return this.commentRepo.save(comment);
  }
}
