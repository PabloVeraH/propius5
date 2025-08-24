import { Email } from '../value-objects/email.vo';
import { Credentials } from '../value-objects/credentials.vo';

export type UserId = string;

export class User {
  private roles: string[] = [];
  private permissions: string[] = [];
  private active = true;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    private readonly id: UserId,
    private email: Email,
    private credentials: Credentials,
    options?: { roles?: string[]; permissions?: string[]; active?: boolean; createdAt?: Date; updatedAt?: Date }
  ) {
    this.roles = options?.roles ?? [];
    this.permissions = options?.permissions ?? [];
    this.active = options?.active ?? true;
    this.createdAt = options?.createdAt ?? new Date();
    this.updatedAt = options?.updatedAt ?? new Date();
  }

  static register(id: UserId, email: Email, hashedPassword: string): User {
    return new User(id, email, Credentials.fromHash(hashedPassword), { roles: ['user'] });
  }

  getId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
  getRoles(): string[] { return [...this.roles]; }
  getPermissions(): string[] { return [...this.permissions]; }
  isActive(): boolean { return this.active; }
  getPasswordHash(): string { return this.credentials.value; }

  changePassword(newHashedPassword: string): void {
    this.credentials = Credentials.fromHash(newHashedPassword);
    this.touch();
  }

  assignRole(role: string): void {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
      this.touch();
    }
  }

  removeRole(role: string): void {
    this.roles = this.roles.filter(r => r !== role);
    this.touch();
  }

  grantPermission(perm: string): void {
    if (!this.permissions.includes(perm)) {
      this.permissions.push(perm);
      this.touch();
    }
  }

  revokePermission(perm: string): void {
    this.permissions = this.permissions.filter(p => p !== perm);
    this.touch();
  }

  deactivate(): void { this.active = false; this.touch(); }
  reactivate(): void { this.active = true; this.touch(); }

  private touch() { this.updatedAt = new Date(); }
}