import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../../../application/dtos/auth.dtos';
import { RegisterUserCommand } from '../../../application/commands/register-user.command';
import { LoginCommand } from '../../../application/commands/login.command';
import { RefreshTokenCommand } from '../../../application/commands/refresh-token.command';
import { RequestPasswordResetCommand } from '../../../application/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../../../application/commands/reset-password.command';
import { GetMeQuery } from '../../../application/queries/get-me.query';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesPermsGuard } from './guards/roles-perms.guard';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.commandBus.execute(new RegisterUserCommand(dto.email, dto.password));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.commandBus.execute(new LoginCommand(dto.email, dto.password));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.commandBus.execute(new RefreshTokenCommand(refreshToken));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.commandBus.execute(new RequestPasswordResetCommand(dto.email));
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.commandBus.execute(new ResetPasswordCommand(dto.token, dto.newPassword));
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesPermsGuard)
  @Auth() // sin requisitos específicos
  async me(@Req() req: any) {
    return this.queryBus.execute(new GetMeQuery(req.user.sub));
  }
}