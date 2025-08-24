import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../commands/register-user.command';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { EmailAlreadyTakenError, PasswordPolicyViolationError } from '../../domain/exceptions/domain.exceptions';
import { HasherPort } from '../ports/hasher.port';
import { UuidPort } from '../ports/uuid.port';
import { User } from '../../domain/entities/user.entity';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: HasherPort,
    private readonly uuid: UuidPort,
    private readonly eventBus: EventBus
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<{ id: string; email: string }> {
    const email = Email.create(cmd.email);

    if (await this.users.emailExists(email)) {
      throw new EmailAlreadyTakenError();
    }

    // Política de contraseña mínima (p. ej. 8 chars) aquí o en un Domain Service
    if (!cmd.password || cmd.password.length < 8) {
      throw new PasswordPolicyViolationError();
    }

    const hashed = await this.hasher.hash(cmd.password);
    const user = User.register(this.uuid.generate(), email, hashed);

    await this.users.save(user);

    this.eventBus.publish(new UserRegisteredEvent(user.getId(), email.toString()));

    return { id: user.getId(), email: email.toString() };
    }
}