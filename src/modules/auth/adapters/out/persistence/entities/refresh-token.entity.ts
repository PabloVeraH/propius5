import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn('varchar', { length: 128 })
  jti: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Index()
  @Column('varchar', { length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  hashedToken: string;

  @Index()
  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}