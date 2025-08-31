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
import { USER_REPO, HASHER, NOTIFIER, RESET_REPO, UUID, CLOCK } from '../../tokens';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand> {
  constructor(
    @Inject(USER_REPO) private readonly users: UserRepository,
    @Inject(RESET_REPO) private readonly resetRepo: PasswordResetTokenRepository,
    @Inject(NOTIFIER) private readonly notifier: NotifierPort,
    @Inject(HASHER) private readonly hasher: HasherPort,
    @Inject(UUID) private readonly uuid: UuidPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
    private readonly config: ConfigService,
  ) {}

  async execute(cmd: RequestPasswordResetCommand): Promise<void> {
    const email = Email.create(cmd.email);
    const user = await this.users.findByEmail(email);
    if (!user) return; // evitar user enumeration

    const rawToken = this.uuid.generate();
    const digest = createHash('sha256').update(rawToken, 'utf8').digest('hex');
    const expiresAt = this.clock.addMinutes(this.clock.now(), 30);
    await this.resetRepo.createHash(user.getId(), digest, expiresAt);
    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontend}/reset-password?token=${encodeURIComponent(rawToken)}`;

    // Enviar link con raw token
    await this.notifier.sendEmail(
      email.toString(),
      'Recuperación de contraseña',
      'reset-password',
      { token: rawToken, resetUrl, frontendBaseUrl: frontend },
    );
  }
}