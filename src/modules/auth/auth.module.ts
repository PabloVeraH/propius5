import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

import { USER_REPO, REFRESH_REPO, RESET_REPO, HASHER, TOKEN, NOTIFIER, UUID, CLOCK } from './tokens';

// Entidades y repositorios TypeORM
import { UserEntity } from './adapters/out/persistence/entities/user.entity';
import { RoleEntity } from './adapters/out/persistence/entities/role.entity';
import { PermissionEntity } from './adapters/out/persistence/entities/permission.entity';
import { RefreshTokenEntity } from './adapters/out/persistence/entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './adapters/out/persistence/entities/password-reset-token.entity';

import { UserTypeOrmRepository } from './adapters/out/persistence/user.typeorm.repository';

import { RefreshTokenTypeOrmRepository, PasswordResetTokenTypeOrmRepository } from './adapters/out/persistence/token.typeorm.repository';

import { MailService } from '../shared/mail/mail.service';

class SystemClock {
  now() { return new Date(); }
  addMinutes(date: Date, minutes: number) { return new Date(date.getTime() + minutes * 60000); }
  addDays(date: Date, days: number) { return new Date(date.getTime() + days * 24 * 60 * 60000); }
}


//console.log(`auth.module JWT_SECRET: ${ConfigService.get<string>('JWT_SECRET', '')}`);

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', ''), // lee del .env
        signOptions: { expiresIn: '1d' },
      }),
      // signOptions: { issuer: 'your-app' }
    }),
    TypeOrmModule.forFeature([
      UserEntity, RoleEntity, PermissionEntity, RefreshTokenEntity, PasswordResetTokenEntity
    ]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy, JwtAuthGuard, RolesPermsGuard,
    RegisterUserHandler, LoginHandler, RefreshTokenHandler, RequestPasswordResetHandler, ResetPasswordHandler,

    { provide: HASHER, useClass: BcryptHasherAdapter },
    { provide: TOKEN, useClass: JwtTokenAdapter },
    { provide: NOTIFIER, useClass: MailerAdapter },
    { provide: UUID, useClass: UuidAdapter },
    { provide: CLOCK, useValue: new SystemClock() },

    // Cambios de Prisma -> TypeORM
    { provide: USER_REPO, useClass: UserTypeOrmRepository },
    { provide: REFRESH_REPO, useClass: RefreshTokenTypeOrmRepository },
    { provide: RESET_REPO, useClass: PasswordResetTokenTypeOrmRepository },

    MailService,
  ],
})
export class AuthModule {}