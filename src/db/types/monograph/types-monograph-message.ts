import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface MonographMessage {
  id: Generated<number>;
  message_type: string;
  monograph_publisher_id: number | null; // Always required
  monograph_publication_request_id: number | null; // Required with ISBN_ASSINGMENT / ISMN_ASSIGNMENT message type
  isbn_publisher_range_id: number | null; // Required with ISBN_LIST_DELIVERY
  ismn_publisher_range_id: number | null; // Required with ISMN_LIST_DELIVERY
  lang_code: string;
  recipient: string;
  subject: string;
  body: string;
  sent: Date;
  sent_by: string;
}

export type MonographMessageInsert = Insertable<MonographMessage>;
export type MonographMessageUpdate = Updateable<MonographMessage>;
export type MonographMessageSelect = Selectable<MonographMessage>;
