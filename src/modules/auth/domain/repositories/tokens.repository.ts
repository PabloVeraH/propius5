// Persistencia de refresh tokens (rotación) y password reset tokens (ambos hasheados).
export interface RefreshTokenRepository {
  storeHash(userId: string, jti: string, hashedToken: string, expiresAt: Date): Promise<void>;
  findByJti(jti: string): Promise<{ userId: string; hashedToken: string; revokedAt: Date | null } | null>;
  revokeByJti(jti: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface PasswordResetTokenRepository {
  createHash(userId: string, hashedToken: string, expiresAt: Date): Promise<void>;
  consumeIfValid(hashedToken: string): Promise<{ userId: string } | null>;
}