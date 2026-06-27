import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from '../../src/auth/refresh-token.service';
import { PrismaService } from '../../src/common/database/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: PrismaService;

  const mockRefreshToken = {
    id: 'token-1',
    token: 'hashed-token',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    revokedAt: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn().mockResolvedValue(mockRefreshToken),
              findUnique: jest.fn().mockResolvedValue(mockRefreshToken),
              updateMany: jest.fn().mockResolvedValue({ count: 1 })
            }
          }
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('604800000') }
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('new-jwt-token') }
        }
      ]
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate a refresh token', async () => {
    const token = await service.generate('user-1');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(128);
  });

  it('should validate a valid token', async () => {
    const result = await service.validate('some-raw-token');
    expect(result.userId).toBe('user-1');
    expect(result.tokenId).toBe('token-1');
  });

  it('should throw on revoked token', async () => {
    jest
      .spyOn(prisma.refreshToken, 'findUnique')
      .mockResolvedValue({ ...mockRefreshToken, revokedAt: new Date() });
    await expect(service.validate('revoked-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw on expired token', async () => {
    jest
      .spyOn(prisma.refreshToken, 'findUnique')
      .mockResolvedValue({ ...mockRefreshToken, expiresAt: new Date(Date.now() - 1000) });
    await expect(service.validate('expired-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should revoke a token', async () => {
    await service.revoke('some-token');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('should revoke all tokens for user', async () => {
    await service.revokeAllForUser('user-1');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it('should rotate a token', async () => {
    const result = await service.rotate('old-token');
    expect(result.accessToken).toBe('new-jwt-token');
    expect(result.refreshToken).toBeDefined();
  });
});
