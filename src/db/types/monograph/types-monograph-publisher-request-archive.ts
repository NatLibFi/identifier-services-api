import type { Generated, JSONColumnType, Insertable, Selectable } from 'kysely';

import type { MonographPublisherContactPerson } from './types-monograph-publisher.ts';

export interface MonographPublisherRequestArchive {
  id: Generated<number>;
  monograph_publisher_id: number | null;
  monograph_publisher_request_id: number | null;
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
}

export type MonographPublisherRequestArchiveInsert = Insertable<MonographPublisherRequestArchive>;
export type MonographPublisherRequestArchiveSelect = Selectable<MonographPublisherRequestArchive>;
