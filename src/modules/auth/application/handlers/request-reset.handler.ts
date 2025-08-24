import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RequestPasswordResetCommand } from '../commands/request-password-reset.command';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordResetTokenRepository } from '../../domain/repositories/tokens.repository';
import { NotifierPort } from '../ports/notifier.port';
import { HasherPort } from '../ports/hasher.port';
import { UuidPort } from '../ports/uuid.port';
import { ClockPort } from '../ports/clock.port';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand> {
  constructor(
    private readonly users: UserRepository,
    private readonly resetRepo: PasswordResetTokenRepository,
    private readonly notifier: NotifierPort,
    private readonly hasher: HasherPort,
    private readonly uuid: UuidPort,
    private readonly clock: ClockPort
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