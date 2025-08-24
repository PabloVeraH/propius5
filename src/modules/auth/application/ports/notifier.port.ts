export interface NotifierPort {
  sendEmail(to: string, subject: string, template: string, variables: Record<string, string>): Promise<void>;
}