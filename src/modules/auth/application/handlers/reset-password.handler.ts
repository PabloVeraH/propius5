import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResetPasswordCommand } from '../commands/reset-password.command';
import { PasswordResetTokenRepository } from '../../domain/repositories/tokens.repository';
import { HasherPort } from '../ports/hasher.port';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordPolicyViolationError } from '../../domain/exceptions/domain.exceptions';
import { USER_REPO, HASHER, RESET_REPO } from '../../tokens';
import { createHash } from 'crypto';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    @Inject(RESET_REPO) private readonly resetRepo: PasswordResetTokenRepository,
    @Inject(HASHER) private readonly hasher: HasherPort,
    @Inject(USER_REPO) private readonly users: UserRepository
  ) {}

  async execute(cmd: ResetPasswordCommand): Promise<void> {
    if (!cmd.newPassword || cmd.newPassword.length < 8) throw new PasswordPolicyViolationError();

    // Hash del token entrante y consumo atómico
    const candidateDigest = createHash('sha256').update(cmd.token, 'utf8').digest('hex');
    const consumed = await this.resetRepo.consumeIfValid(candidateDigest);
    if (!consumed) return; // token inválido/expirado o ya usado

    const user = await this.users.findById(consumed.userId);
    if (!user) return;

    const newHash = await this.hasher.hash(cmd.newPassword);
    user.changePassword(newHash);
    await this.users.save(user);
  }
}