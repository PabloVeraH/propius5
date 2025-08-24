import { User, UserId } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  emailExists(email: Email): Promise<boolean>;
  save(user: User): Promise<void>;
}