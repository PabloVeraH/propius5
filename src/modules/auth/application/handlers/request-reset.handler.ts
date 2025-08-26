import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RequestPasswordResetCommand } from '../commands/request-password-reset.command';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordResetTokenRepository } from '../../domain/repositories/tokens.repository';
import { NotifierPort } from '../ports/notifier.port';
import { HasherPort } from '../ports/hasher.port';
import { UuidPort } from '../ports/uuid.port';
import { ClockPort } from '../ports/clock.port';
import { USER_REPO, HASHER, NOTIFIER, REFRESH_REPO, UUID, CLOCK } from '../../tokens';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand> {
  constructor(
    @Inject(USER_REPO) private readonly users: UserRepository,
    @Inject(REFRESH_REPO) private readonly resetRepo: PasswordResetTokenRepository,
    @Inject(NOTIFIER) private readonly notifier: NotifierPort,
    @Inject(HASHER) private readonly hasher: HasherPort,
    @Inject(UUID) private readonly uuid: UuidPort,
    @Inject(CLOCK) private readonly clock: ClockPort
  ) {}

  async execute(cmd: RequestPasswordResetCommand): Promise<void> {
    const email = Email.create(cmd.email);
    const user = await this.users.findByEmail(email);
    if (!user) return; // evitar user enumeration

    const rawToken = this.uuid.generate(); // aleatorio opaco
    const hashed = await this.hasher.hash(rawToken);
    const expiresAt = this.clock.addMinutes(this.clock.now(), 30);
    await this.resetRepo.createHash(user.getId(), hashed, expiresAt);

    // Enviar link con raw token
    await this.notifier.sendEmail(
      email.toString(),
      'Recuperación de contraseña',
      'reset-password',
      { token: rawToken } // El front formará la URL
    );
  }
}