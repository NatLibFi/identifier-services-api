import type { Generated, Selectable } from 'kysely';

export interface MessageTemplate {
  id: Generated<number>;
  name: string;
  message_type: string;
  lang_code: string;
  subject: string;
  body: string;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MessageTemplateSelect = Selectable<MessageTemplate>;
