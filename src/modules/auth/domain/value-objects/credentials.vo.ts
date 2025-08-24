// Dominio puro: NO dependencias de Nest ni libs externas.
export class Credentials {
  private constructor(private readonly hash: string) {
    if (!hash || hash.length < 20) {
      throw new Error('Invalid credentials hash');
    }
  }

  static fromHash(hash: string): Credentials {
    return new Credentials(hash);
  }

  get value(): string {
    return this.hash;
  }

  equals(other: Credentials): boolean {
    return this.hash === other.hash;
  }
}