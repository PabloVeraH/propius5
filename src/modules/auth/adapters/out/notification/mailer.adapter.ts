import { Injectable } from '@nestjs/common';
import { NotifierPort } from '../../../application/ports/notifier.port';
import { MailService } from '../../../../shared/mail/mail.service';

@Injectable()
export class MailerAdapter implements NotifierPort {
  constructor(private readonly mail: MailService) {}
  async sendEmail(to: string, subject: string, template: string, variables: Record<string, string>): Promise<void> {
    await this.mail.send({ to, subject, template, variables });
  }
}