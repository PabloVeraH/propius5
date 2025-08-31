import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Credentials } from '../../../domain/value-objects/credentials.vo';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly perms: Repository<PermissionEntity>,
  ) {}

  private toDomain(row: UserEntity): User {
    const credentials = Credentials.fromHash(row.passwordHash);
    return new (User as any)(
      row.id,
      Email.create(row.email),
      credentials,
      {
        roles: row.roles?.map(r => r.name) ?? [],
        permissions: row.permissions?.map(p => p.name) ?? [],
        active: row.active,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }
    );
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { id }, relations: ['roles', 'permissions'] });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.users.findOne({ where: { email: email.toString() }, relations: ['roles', 'permissions'] });
    return row ? this.toDomain(row) : null;
  }

  async emailExists(email: Email): Promise<boolean> {
    return await this.users.exist({ where: { email: email.toString() } });
  }

  async save(user: User): Promise<void> {
    const id = user.getId();
    const roles = user.getRoles();
    const perms = user.getPermissions();

    // upsert roles/permissions por nombre
    if (roles.length) {
      await this.roles.upsert(roles.map(name => ({ name })), ['name']);
    }
    if (perms.length) {
      await this.perms.upsert(perms.map(name => ({ name })), ['name']);
    }

    const roleEntities = roles.length ? await this.roles.find({ where: { name: In(roles) } }) : [];
    const permEntities = perms.length ? await this.perms.find({ where: { name: In(perms) } }) : [];

    const existing = await this.users.findOne({ where: { id }, relations: ['roles', 'permissions'] });

    if (existing) {
      existing.email = user.getEmail().toString();
      existing.passwordHash = user.getPasswordHash();
      existing.active = user.isActive();
      existing.roles = roleEntities;
      existing.permissions = permEntities;
      await this.users.save(existing);
    } else {
      const toCreate = this.users.create({
        id,
        email: user.getEmail().toString(),
        passwordHash: user.getPasswordHash(),
        active: user.isActive(),
        roles: roleEntities,
        permissions: permEntities,
      });
      await this.users.save(toCreate);
    }
  }
}