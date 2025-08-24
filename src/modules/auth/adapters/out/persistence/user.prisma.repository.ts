import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Credentials } from '../../../domain/value-objects/credentials.vo';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: { roles: true, permissions: true } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toString() }, include: { roles: true, permissions: true } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async emailExists(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email: email.toString() } });
    return count > 0;
  }

  async save(user: User): Promise<void> {
    const id = user.getId();
    await this.prisma.user.upsert({
      where: { id },
      update: {
        email: user.getEmail().toString(),
        passwordHash: user.getPasswordHash(),
        active: user.isActive(),
        roles: { set: [], connectOrCreate: user.getRoles().map(name => ({ where: { name }, create: { name } })) },
        permissions: { set: [], connectOrCreate: user.getPermissions().map(name => ({ where: { name }, create: { name } })) }
      },
      create: {
        id,
        email: user.getEmail().toString(),
        passwordHash: user.getPasswordHash(),
        active: user.isActive(),
        roles: { connectOrCreate: user.getRoles().map(name => ({ where: { name }, create: { name } })) },
        permissions: { connectOrCreate: user.getPermissions().map(name => ({ where: { name }, create: { name } })) }
      }
    });
  }

    private toDomain(row: any): User {
        const credentials = Credentials.fromHash(row.passwordHash);
        return new (User as any)(
        row.id,
        Email.create(row.email),
        credentials,
        {
            roles: row.roles?.map((r: any) => r.name) ?? [],
            permissions: row.permissions?.map((p: any) => p.name) ?? [],
            active: row.active,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        }
    );
  }
}