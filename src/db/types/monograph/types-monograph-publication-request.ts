import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface MonographPublicationRequest {
  id: Generated<number>;
  monograph_publisher_id: number | null;
  monograph_publication_id: number;
  official_name: string;
  publisher_identifier_str: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  lang_code: string;
  contact_person: string | null;
  published_before: boolean;
  publishing_activity: string | null;
  publishing_activity_amount: string | null;
  publications_intra: boolean;
  publications_public: boolean;
  comments: string | null;
  request_state: string;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublicationRequestInsert = Insertable<MonographPublicationRequest>;
export type MonographPublicationRequestUpdate = Updateable<MonographPublicationRequest>;
export type MonographPublicationRequestSelect = Selectable<MonographPublicationRequest>;
