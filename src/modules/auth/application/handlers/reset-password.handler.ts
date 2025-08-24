import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResetPasswordCommand } from '../commands/reset-password.command';
import { PasswordResetTokenRepository } from '../../domain/repositories/tokens.repository';
import { HasherPort } from '../ports/hasher.port';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordPolicyViolationError } from '../../domain/exceptions/domain.exceptions';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    private readonly resetRepo: PasswordResetTokenRepository,
    private readonly hasher: HasherPort,
    private readonly users: UserRepository
  ) {}

  async execute(cmd: ResetPasswordCommand): Promise<void> {
    if (!cmd.newPassword || cmd.newPassword.length < 8) throw new PasswordPolicyViolationError();

    // Hash del token entrante y consumo atómico
    const candidateHash = await this.hasher.hash(cmd.token); // mejor usar compare contra cada registro; alternativamente usar un HMAC estable
    const consumed = await this.resetRepo.consumeIfValid(candidateHash);
    if (!consumed) return; // token inválido/expirado o ya usado

    const user = await this.users.findById(consumed.userId);
    if (!user) return;

    const newHash = await this.hasher.hash(cmd.newPassword);
    user.changePassword(newHash);
    await this.users.save(user);
  }
}