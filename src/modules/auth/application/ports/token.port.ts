export type AccessTokenPayload = { sub: string; email: string; roles: string[]; perms: string[] };
export type RefreshTokenPayload = { sub: string; jti: string };

export interface TokenPort {
  signAccessToken(payload: AccessTokenPayload, expiresIn: string): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayload, expiresIn: string): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}