import { Injectable } from '@nestjs/common';
import { TokenPort, AccessTokenPayload, RefreshTokenPayload } from '../../../application/ports/token.port';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenAdapter implements TokenPort {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: AccessTokenPayload, expiresIn: string): Promise<string> {
    return this.jwt.signAsync(payload, { expiresIn });
  }

  signRefreshToken(payload: RefreshTokenPayload, expiresIn: string): Promise<string> {
    return this.jwt.signAsync(payload, { expiresIn });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwt.verifyAsync<RefreshTokenPayload>(token);
  }
}