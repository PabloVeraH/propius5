import {
  Entity, PrimaryColumn, Column, ManyToMany, JoinTable,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('users')
export class UserEntity {

  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToMany(() => RoleEntity, r => r.users, { cascade: false })
  @JoinTable({ name: 'user_roles' })
  roles: RoleEntity[];

  @ManyToMany(() => PermissionEntity, p => p.users, { cascade: false })
  @JoinTable({ name: 'user_permissions' })
  permissions: PermissionEntity[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}