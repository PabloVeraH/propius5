import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserEntity } from './modules/auth/adapters/out/persistence/entities/user.entity';
import { RoleEntity } from './modules/auth/adapters/out/persistence/entities/role.entity';
import { PermissionEntity } from './modules/auth/adapters/out/persistence/entities/permission.entity';
import { RefreshTokenEntity } from './modules/auth/adapters/out/persistence/entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './modules/auth/adapters/out/persistence/entities/password-reset-token.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.SQLITE_DB_PATH || 'data/db.sqlite',
  entities: [UserEntity, RoleEntity, PermissionEntity, RefreshTokenEntity, PasswordResetTokenEntity],
  migrations: ['src/migrations/*.ts'], // Cambiar a .ts
  synchronize: true,
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;