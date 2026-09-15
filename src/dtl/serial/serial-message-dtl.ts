import type { SerialMessageSelect } from '../../db/types/serial/types-serial-message.ts';

export function asSerialMessageAdminRead(message: SerialMessageSelect): SerialMessageSelect {
  const {
    id,
    message_type,
    serial_publisher_id,
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
    serial_publication_request_id,
    lang_code,
    recipient,
    subject,
    body,
    sent,
    sent_by,
  };
}
