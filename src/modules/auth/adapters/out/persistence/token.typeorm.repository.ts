import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenRepository, PasswordResetTokenRepository } from '../../../domain/repositories/tokens.repository';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

@Injectable()
export class RefreshTokenTypeOrmRepository implements RefreshTokenRepository {
  constructor(@InjectRepository(RefreshTokenEntity) private readonly repo: Repository<RefreshTokenEntity>) {}

  async storeHash(userId: string, jti: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await this.repo.save(
      this.repo.create({ jti, userId, hashedToken, expiresAt, revokedAt: null })
    );
  }

  async findByJti(jti: string): Promise<{ userId: string; hashedToken: string; revokedAt: Date | null } | null> {
    const row = await this.repo.findOne({ where: { jti } });
    return row ? { userId: row.userId, hashedToken: row.hashedToken, revokedAt: row.revokedAt } : null;
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.repo.update({ jti }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt: () => 'CURRENT_TIMESTAMP' })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }
}

@Injectable()
export class PasswordResetTokenTypeOrmRepository implements PasswordResetTokenRepository {
  constructor(@InjectRepository(PasswordResetTokenEntity) private readonly repo: Repository<PasswordResetTokenEntity>) {}

  async createHash(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await this.repo.save(this.repo.create({ userId, hashedToken, expiresAt, usedAt: null }));
  }

  async consumeIfValid(hashedToken: string): Promise<{ userId: string } | null> {
    const now = new Date();
    const row = await this.repo.createQueryBuilder('prt')
      .where('prt.hashedToken = :hashedToken', { hashedToken })
      .andWhere('prt.usedAt IS NULL')
      .andWhere('prt.expiresAt > :now', { now })
      .getOne();

    if (!row) return null;

    await this.repo.update({ id: row.id }, { usedAt: new Date() });
    return { userId: row.userId };
  }
}