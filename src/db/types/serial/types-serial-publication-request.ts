import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface SerialPublicationRequest {
  id: Generated<number>;
  serial_publisher_id: number | null;
  status: string;
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

export type SerialPublicationRequestInsert = Insertable<SerialPublicationRequest>;
export type SerialPublicationRequestUpdate = Updateable<SerialPublicationRequest>;
export type SerialPublicationRequestSelect = Selectable<SerialPublicationRequest>;

export interface SerialPublicationRequestSelectExtended extends Selectable<SerialPublicationRequest> {
  publications: SerialPublicationRequestSelectExtended[];
}
