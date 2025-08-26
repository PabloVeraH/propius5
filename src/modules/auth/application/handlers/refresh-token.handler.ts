import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { TokenPort } from '../ports/token.port';
import { RefreshTokenRepository } from '../../domain/repositories/tokens.repository';
import { HasherPort } from '../ports/hasher.port';
import { UserRepository } from '../../domain/repositories/user.repository';
import { InvalidCredentialsError, TokenInvalidOrExpiredError } from '../../domain/exceptions/domain.exceptions';
import { UuidPort } from '../ports/uuid.port';
import { USER_REPO, HASHER, TOKEN, REFRESH_REPO, UUID } from '../../tokens';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(TOKEN) private readonly tokens: TokenPort,
    @Inject(REFRESH_REPO) private readonly refreshRepo: RefreshTokenRepository,
    @Inject(HASHER) private readonly hasher: HasherPort,
    @Inject(USER_REPO) private readonly users: UserRepository,
    @Inject(UUID) private readonly uuid: UuidPort
  ) {}

  async execute(cmd: RefreshTokenCommand): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.tokens.verifyRefreshToken(cmd.refreshToken);
    } catch {
      throw new TokenInvalidOrExpiredError();
    }

    const record = await this.refreshRepo.findByJti(payload.jti);
    if (!record || record.revokedAt) throw new TokenInvalidOrExpiredError();

    // Prevención de reuse: comparar hash
    const matches = await this.hasher.compare(cmd.refreshToken, record.hashedToken);
    if (!matches) {
      await this.refreshRepo.revokeAllForUser(record.userId);
      throw new InvalidCredentialsError();
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive()) throw new InvalidCredentialsError();

    const accessToken = await this.tokens.signAccessToken(
      { sub: user.getId(), email: user.getEmail().toString(), roles: user.getRoles(), perms: user.getPermissions() },
      '15m'
    );

    // Rotar refresh: revocar jti anterior y emitir uno nuevo
    await this.refreshRepo.revokeByJti(payload.jti);
    const newJti = this.uuid.generate();
    const newRefreshToken = await this.tokens.signRefreshToken({ sub: user.getId(), jti: newJti }, '14d');
    const newHashed = await this.hasher.hash(newRefreshToken);
    await this.refreshRepo.storeHash(user.getId(), newJti, newHashed, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    return { accessToken, refreshToken: newRefreshToken };
  }
}