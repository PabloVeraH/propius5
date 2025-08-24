import { Injectable } from '@nestjs/common';
import { UuidPort } from '../../../application/ports/uuid.port';
import { randomUUID } from 'crypto';

@Injectable()
export class UuidAdapter implements UuidPort {
  generate(): string {
    return randomUUID();
  }
}