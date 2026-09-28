import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { Task } from '../entities/Task.js';
import { Project } from '../entities/Project.js';
import { CommentsService } from '../comments/comments.service.js';

describe('TasksService.findOne', () => {
  let service: TasksService;
  let mockQueryBuilder: {
    leftJoinAndSelect: ReturnType<typeof vi.fn>;
    addSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    getRawAndEntities: ReturnType<typeof vi.fn>;
  };
  let mockTaskRepo: { createQueryBuilder: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawAndEntities: vi.fn(),
    };
    mockTaskRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: CommentsService, useValue: {} },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('returns the exact task object the repository resolves, field by field', async () => {
    const fakeProject = { id: 3, name: 'Website Redesign' } as Project;
    const fakeTask = {
      id: 1,
      title: 'Fix login bug',
      description: 'Users cannot log in on Safari',
      status: 'in_progress',
      priority: 4,
      project: fakeProject,
      assignee: null,
      tags: [],
    } as unknown as Task;

    mockQueryBuilder.getRawAndEntities.mockResolvedValue({
      entities: [fakeTask],
      raw: [{ commentCount: '3' }],
    });

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
    expect(result.title).toBe('Fix login bug');
    expect(result.status).toBe('in_progress');
    expect(result.priority).toBe(4);
    expect(result.project).toBe(fakeProject);
    expect(result.assignee).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.commentCount).toBe(3);

    expect(mockTaskRepo.createQueryBuilder).toHaveBeenCalledWith('task');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('task.id = :id', {
      id: 1,
    });
  });

  it('throws NotFoundException when the query returns no entity', async () => {
    mockQueryBuilder.getRawAndEntities.mockResolvedValue({
      entities: [],
      raw: [],
    });

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
