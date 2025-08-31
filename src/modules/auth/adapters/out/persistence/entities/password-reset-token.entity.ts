import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  // Opción 1: TypeORM genera UUID en la app (válido también en SQLite)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Opción 2 alternativa (si tu versión/driver no soporta lo anterior):
  // @PrimaryColumn('varchar', { length: 36 }) id: string; // y tú asignas el uuid en el repo

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Index()
  @Column('varchar', { length: 36 })
  userId: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  hashedToken: string;

  @Index()
  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null;
}