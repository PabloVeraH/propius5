import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository, PasswordResetTokenRepository } from '../../../domain/repositories/tokens.repository';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class RefreshTokenPrismaRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async storeHash(userId: string, jti: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, jti, hashedToken, expiresAt } });
  }

  async findByJti(jti: string): Promise<{ userId: string; hashedToken: string; revokedAt: Date | null } | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { jti } });
    return row ? { userId: row.userId, hashedToken: row.hashedToken, revokedAt: row.revokedAt } : null;
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { jti }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

@Injectable()
export class PasswordResetTokenPrismaRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHash(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.create({ data: { userId, hashedToken, expiresAt, usedAt: null } });
  }

  async consumeIfValid(hashedToken: string): Promise<{ userId: string } | null> {
    const now = new Date();
    const row = await this.prisma.passwordResetToken.findFirst({ where: { hashedToken, usedAt: null, expiresAt: { gt: now } } });
    if (!row) return null;
    await this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: now } });
    return { userId: row.userId };
  }
}