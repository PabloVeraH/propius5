import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { UserEntity } from '../../auth/adapters/out/persistence/entities/user.entity';
import { RoleEntity } from '../../auth/adapters/out/persistence/entities/role.entity';
import { PermissionEntity } from '../../auth/adapters/out/persistence/entities/permission.entity';
import { RefreshTokenEntity } from '../../auth/adapters/out/persistence/entities/refresh-token.entity';
import { PasswordResetTokenEntity } from '../../auth/adapters/out/persistence/entities/password-reset-token.entity';

function parseDbUrl(url?: string): DataSourceOptions {
  // Para Postgres con DATABASE_URL estilo: postgres://user:pass@host:port/db
  if (!url) throw new Error('DATABASE_URL no definido');
  return {
    type: 'sqlite',
    database: process.env.SQLITE_DB_PATH || 'data/db.sqlite',
    entities: [UserEntity, RoleEntity, PermissionEntity, RefreshTokenEntity, PasswordResetTokenEntity],
    synchronize: true, // true solo en desarrollo, recomendable false + migraciones
    logging: process.env.NODE_ENV !== 'production',
  };
}

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => parseDbUrl(process.env.DATABASE_URL),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}