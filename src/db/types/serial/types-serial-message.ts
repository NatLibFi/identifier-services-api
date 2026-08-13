import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface SerialMessage {
  id: Generated<number>;
  message_type: string;
  serial_publisher_id: number;
  serial_publication_request_id: number | null;
  isbn_publisher_range_id: number | null;
  ismn_publisher_range_id: number | null;
  lang_code: string;
  recipient: string;
  subject: string;
  body: string;
  sent: Date;
  sent_by: string;
}

export type SerialMessageInsert = Insertable<SerialMessage>;
export type SerialMessageUpdate = Updateable<SerialMessage>;
export type SerialMessageSelect = Selectable<SerialMessage>;
