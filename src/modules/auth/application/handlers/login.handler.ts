import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from '../commands/login.command';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { HasherPort } from '../ports/hasher.port';
import { InvalidCredentialsError, UserNotFoundError } from '../../domain/exceptions/domain.exceptions';
import { TokenPort } from '../ports/token.port';
import { RefreshTokenRepository } from '../../domain/repositories/tokens.repository';
import { ClockPort } from '../ports/clock.port';
import { UuidPort } from '../ports/uuid.port';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: HasherPort,
    private readonly tokens: TokenPort,
    private readonly refreshRepo: RefreshTokenRepository,
    private readonly clock: ClockPort,
    private readonly uuid: UuidPort
  ) {}

  async execute(cmd: LoginCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const email = Email.create(cmd.email);

    // 1) Buscar usuario
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive()) throw new UserNotFoundError();

    // 2) Comparar contraseña con hash (bcrypt)
    const ok = await this.hasher.compare(cmd.password, user.getPasswordHash());
    if (!ok) throw new InvalidCredentialsError();

    // 3) Generar tokens
    const accessPayload = { sub: user.getId(), email: email.toString(), roles: user.getRoles(), perms: user.getPermissions() };
    const jti = this.uuid.generate();
    const refreshPayload = { sub: user.getId(), jti };

    const accessToken = await this.tokens.signAccessToken(accessPayload, '15m');
    const refreshToken = await this.tokens.signRefreshToken(refreshPayload, '14d');

    // 4) Guardar hash del refresh para rotación y revocación
    const expiresAt = this.clock.addDays(this.clock.now(), 14);
    const hashedRt = await this.hasher.hash(refreshToken);
    await this.refreshRepo.storeHash(user.getId(), jti, hashedRt, expiresAt);

    return { accessToken, refreshToken };
  }
}