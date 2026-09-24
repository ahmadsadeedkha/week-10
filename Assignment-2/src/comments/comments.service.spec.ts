import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { Comment } from '../entities/Comment.js';
import { User } from '../entities/User.js';
import { Task } from '../entities/Task.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockCommentRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: { findOneBy: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockCommentRepo = {
      create: vi.fn(),
      save: vi.fn(),
      findAndCount: vi.fn(),
    };
    mockUserRepo = {
      findOneBy: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('creates a comment when the author exists', async () => {
    const fakeUser = { id: 1, name: 'Alice' } as User;
    const fakeTask = { id: 5 } as Task;
    const fakeComment = {
      id: 10,
      body: 'test',
      task: fakeTask,
      author: fakeUser,
    } as Comment;

    mockUserRepo.findOneBy.mockResolvedValue(fakeUser);
    mockCommentRepo.create.mockReturnValue(fakeComment);
    mockCommentRepo.save.mockResolvedValue(fakeComment);

    const result = await service.createForTask(
      { body: 'test', authorId: 1 },
      fakeTask,
    );

    expect(result).toBe(fakeComment);
    expect(mockCommentRepo.save).toHaveBeenCalledWith(fakeComment);
  });

  it('throws NotFoundException when the author does not exist', async () => {
    mockUserRepo.findOneBy.mockResolvedValue(null);
    const fakeTask = { id: 5 } as Task;

    await expect(
      service.createForTask({ body: 'test', authorId: 999 }, fakeTask),
    ).rejects.toThrow(NotFoundException);

    expect(mockCommentRepo.save).not.toHaveBeenCalled();
  });

  it('returns only comments belonging to the given task', async () => {
    const fakeComments = [
      { id: 1, body: 'first', task: { id: 5 } },
      { id: 2, body: 'second', task: { id: 5 } },
    ] as Comment[];

    mockCommentRepo.findAndCount.mockResolvedValue([fakeComments, 2]);

    const result = await service.findAllForTask(5);

    expect(result.items).toBe(fakeComments);
    expect(result.total).toBe(2);
    expect(mockCommentRepo.findAndCount).toHaveBeenCalledWith({
      where: { task: { id: 5 } },
      skip: 0,
      take: 10,
      order: { created_at: 'ASC' },
    });
  });
});
