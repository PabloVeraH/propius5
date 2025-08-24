import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './adapters/in/http/auth.controller';
import { JwtStrategy } from './adapters/in/http/strategies/jwt.strategy';
import { JwtAuthGuard } from './adapters/in/http/guards/jwt.guard';
import { RolesPermsGuard } from './adapters/in/http/guards/roles-perms.guard';

import { RegisterUserHandler } from './application/handlers/register-user.handler';
import { LoginHandler } from './application/handlers/login.handler';
import { RefreshTokenHandler } from './application/handlers/refresh-token.handler';
import { RequestPasswordResetHandler } from './application/handlers/request-reset.handler';
import { ResetPasswordHandler } from './application/handlers/reset-password.handler';

import { BcryptHasherAdapter } from './adapters/out/security/bcrypt.hasher.adapter';
import { JwtTokenAdapter } from './adapters/out/security/jwt.token.adapter';
import { MailerAdapter } from './adapters/out/notification/mailer.adapter';
import { UuidAdapter } from './adapters/out/security/uuid.adapter';

import { UserPrismaRepository } from './adapters/out/persistence/user.prisma.repository';
import { RefreshTokenPrismaRepository, PasswordResetTokenPrismaRepository } from './adapters/out/persistence/token.prisma.repository';

// Tokens de inyección para puertos/repos de dominio
export const USER_REPO = 'USER_REPO';
export const REFRESH_REPO = 'REFRESH_REPO';
export const RESET_REPO = 'RESET_REPO';
export const HASHER = 'HASHER';
export const TOKEN = 'TOKEN';
export const NOTIFIER = 'NOTIFIER';
export const UUID = 'UUID';
export const CLOCK = 'CLOCK';

class SystemClock {
  now() { return new Date(); }
  addMinutes(date: Date, minutes: number) { return new Date(date.getTime() + minutes * 60000); }
  addDays(date: Date, days: number) { return new Date(date.getTime() + days * 24 * 60 * 60000); }
}

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { issuer: 'your-app' }
    })
  ],
  controllers: [AuthController],
  providers: [
    // Strategies/guards
    JwtStrategy, JwtAuthGuard, RolesPermsGuard,

    // Handlers
    RegisterUserHandler, LoginHandler, RefreshTokenHandler, RequestPasswordResetHandler, ResetPasswordHandler,

    // Adapters OUT
    { provide: HASHER, useClass: BcryptHasherAdapter },
    { provide: TOKEN, useClass: JwtTokenAdapter },
    { provide: NOTIFIER, useClass: MailerAdapter },
    { provide: UUID, useClass: UuidAdapter },
    { provide: CLOCK, useValue: new SystemClock() },

    // Repositorios (infra)
    { provide: USER_REPO, useClass: UserPrismaRepository },
    { provide: REFRESH_REPO, useClass: RefreshTokenPrismaRepository },
    { provide: RESET_REPO, useClass: PasswordResetTokenPrismaRepository },

    // Bindings a puertos usados en handlers
    // Nota: En handlers inyecta interfaces, aquí resolvemos con tokens + useExisting o @Inject(token) en constructor
  ],
  exports: []
})
export class AuthModule {}