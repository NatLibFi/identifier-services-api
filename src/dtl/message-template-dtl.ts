import type { MessageTemplateSelect } from '../db/types/message-template.ts';

export function asMessageTemplateAdminRead(messageTemplateInfo: MessageTemplateSelect): MessageTemplateSelect {
  const { id, name, message_type, lang_code, subject, body, created, created_by, modified, modified_by } =
    messageTemplateInfo;

  return {
    id,
    name,
    message_type,
    lang_code,
    subject,
    body,
    created,
    created_by,
    modified,
    modified_by,
  };
}
