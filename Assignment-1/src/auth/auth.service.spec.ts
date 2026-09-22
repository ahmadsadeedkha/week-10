import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { User } from '../entities/User.js';
import { RefreshToken } from '../entities/RefreshToken.js';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let refreshTokenRepo: any;
  let jwtService: any;
  let configService: any;
  let dataSource: any;

  beforeEach(() => {
    userRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((data) => Promise.resolve({ id: 1, ...data })),
      createQueryBuilder: vi.fn(),
    };

    refreshTokenRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((data) => Promise.resolve({ id: 42, ...data })),
      update: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('fake.jwt.token'),
    };

    configService = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      }),
    };

    dataSource = {
      transaction: vi.fn(async (cb) => {
        const manager = {
          update: vi.fn(),
          create: vi.fn((_entity, data) => data),
          save: vi.fn((data) => Promise.resolve({ id: 99, ...data })),
        };
        return cb(manager);
      }),
    };

    service = new AuthService(
      userRepo,
      refreshTokenRepo,
      jwtService,
      configService,
      dataSource,
    );
  });

  describe('login — password verification', () => {
    it('accepts the correct password and returns a token pair', async () => {
      const password_hash = await argon2.hash('correct-password');
      const mockQb = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: 1,
          email: 'test@example.com',
          password_hash,
        }),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('rejects a wrong password with 401', async () => {
      const password_hash = await argon2.hash('correct-password');
      const mockQb = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: 1,
          email: 'test@example.com',
          password_hash,
        }),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the same 401 for a nonexistent email', async () => {
      const mockQb = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      userRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh — rotation', () => {
    it('revokes the old token when rotating', async () => {
      const rawSecret = 'a'.repeat(128);
      const token_hash = await argon2.hash(rawSecret);
      const rawToken = `5.${rawSecret}`;

      refreshTokenRepo.findOne.mockResolvedValue({
        id: 5,
        token_hash,
        revoked_at: null,
        expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1hr in future
        user: { id: 1, email: 'test@example.com' },
      });

      await service.refresh(rawToken);

      // The critical assertion: this is what makes the test fail
      // if you delete/comment out the revoked_at update in refresh().
      const txManager = await dataSource.transaction.mock.results[0].value;
      expect(dataSource.transaction).toHaveBeenCalled();

      // Inspect what the callback passed to manager.update
      const transactionCallback = dataSource.transaction.mock.calls[0][0];
      const spyManager = {
        update: vi.fn(),
        create: vi.fn((_e, d) => d),
        save: vi.fn((d) => Promise.resolve({ id: 99, ...d })),
      };
      await transactionCallback(spyManager);

      expect(spyManager.update).toHaveBeenCalledWith(
        RefreshToken,
        5,
        expect.objectContaining({ revoked_at: expect.any(Date) }),
      );
    });

    it('rejects an already-revoked token', async () => {
      const rawSecret = 'b'.repeat(128);
      const token_hash = await argon2.hash(rawSecret);
      const rawToken = `6.${rawSecret}`;

      refreshTokenRepo.findOne.mockResolvedValue({
        id: 6,
        token_hash,
        revoked_at: new Date(), // already revoked
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: 1, email: 'test@example.com' },
      });

      await expect(service.refresh(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an expired token', async () => {
      const rawSecret = 'c'.repeat(128);
      const token_hash = await argon2.hash(rawSecret);
      const rawToken = `7.${rawSecret}`;

      refreshTokenRepo.findOne.mockResolvedValue({
        id: 7,
        token_hash,
        revoked_at: null,
        expires_at: new Date(Date.now() - 1000), // already expired
        user: { id: 1, email: 'test@example.com' },
      });

      await expect(service.refresh(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
