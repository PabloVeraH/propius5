import { IsEmail, IsString, MinLength, MaxLength, IsJWT } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterUserDto {
  email!: string;
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede exceder 72 caracteres' }) // bcrypt limita a 72 bytes
  password!: string;
}

export class ForgotPasswordDto {
  email!: string;
}

export class ResetPasswordDto {
  token!: string;     // Token de reset (no JWT en dominio; en infra es aleatorio firmado/hasheado)
  newPassword!: string;
}

export class ChangePasswordDto {
  oldPassword!: string;
  newPassword!: string;
}

export class RefreshTokenDto {
  @IsJWT({ message: 'Refresh token inválido' })
  refreshToken!: string;
}