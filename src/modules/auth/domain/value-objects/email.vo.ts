export class Email {
  private constructor(private readonly value: string) {
    const v = value?.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v || !re.test(v)) {
      throw new Error(`Invalid email: '${value}' (processed: '${v}')`);
    }
    this.value = v;
  }

  static create(value: string | undefined | null): Email {
    if (value === undefined || value === null) {
      throw new Error('Email cannot be undefined or null');
    }
    return new Email(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}