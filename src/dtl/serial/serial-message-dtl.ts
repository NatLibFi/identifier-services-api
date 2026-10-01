import type { SerialMessageSelect } from '../../db/types/serial/types-serial-message.ts';

export interface SerialMessageInfo extends SerialMessageSelect {
  serial_publisher_name: string | null;
}

export function asSerialMessageAdminRead(message: SerialMessageInfo): SerialMessageInfo {
  const {
    id,
    message_type,
    serial_publisher_id,
    serial_publisher_name,
    serial_publication_request_id,
    lang_code,
    recipient,
    subject,
    body,
    sent,
    sent_by,
  } = message;

  return {
    id,
    message_type,
    serial_publisher_id,
    serial_publisher_name,
    serial_publication_request_id,
    lang_code,
    recipient,
    subject,
    body,
    sent,
    sent_by,
  };
}

export function asSerialMessageSearchResult(
  serialMessage: SerialMessageSelect,
): Omit<SerialMessageSelect, 'serial_publisher_id' | 'serial_publication_request_id' | 'lang_code' | 'body'> {
  const { id, message_type, recipient, subject, sent, sent_by } = serialMessage;

  return {
    id,
    message_type,
    recipient,
    subject,
    sent,
    sent_by,
  };
}
