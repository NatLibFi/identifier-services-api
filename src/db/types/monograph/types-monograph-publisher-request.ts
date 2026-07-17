import type { Generated, Updateable, JSONColumnType, Insertable, Selectable } from 'kysely';

import type { MonographPublisherContactPerson } from './types-monograph-publisher.ts';

export interface MonographPublisherRequest {
  id: Generated<number>;
  official_name: string;
  other_names: JSONColumnType<string[]>;
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  www: string | null;
  lang_code: string;
  contact_persons: JSONColumnType<MonographPublisherContactPerson[]>;
  additional_info: string | null;
  frequency_current: string | null;
  frequency_next: string | null;
  affiliate_of: string | null;
  affiliates: string | null;
  distributor_of: string | null;
  distributors: string | null;
  classifications: JSONColumnType<string[]>;
  classification_other: string | null;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublisherRequestInsert = Insertable<MonographPublisherRequest>;
export type MonographPublisherRequestUpdate = Updateable<MonographPublisherRequest>;
export type MonographPublisherRequestSelect = Selectable<MonographPublisherRequest>;
