export class Email {
  private constructor(private readonly value: string) {
    const v = value?.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v || !re.test(v)) throw new Error('Invalid email');
    this.value = v;
  }

  static create(value: string): Email {
    return new Email(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}