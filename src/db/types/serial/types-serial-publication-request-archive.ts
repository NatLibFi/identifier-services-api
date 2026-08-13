import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface SerialPublicationRequestArchive {
  id: Generated<number>;
  serial_publication_request_id: number;
  publisher_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  lang_code: string;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type SerialPublicationRequestArchiveInsert = Insertable<SerialPublicationRequestArchive>;
export type SerialPublicationRequestArchiveUpdate = Updateable<SerialPublicationRequestArchive>;
export type SerialPublicationRequestArchiveSelect = Selectable<SerialPublicationRequestArchive>;
