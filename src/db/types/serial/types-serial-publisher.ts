import type { Generated, Updateable, JSONColumnType, Insertable, Selectable } from 'kysely';

export interface SerialPublisherContactPerson {
  name: string;
  email: string;
}

export interface SerialPublisher {
  id: Generated<number>;
  official_name: string;
  contact_persons: JSONColumnType<SerialPublisherContactPerson[]>;
  email_common: string | null;
  phone: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  lang_code: string;
  additional_info: string | null;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type SerialPublisherInsert = Insertable<SerialPublisher>;
export type SerialPublisherUpdate = Updateable<SerialPublisher>;
export type SerialPublisherSelect = Selectable<SerialPublisher>;
