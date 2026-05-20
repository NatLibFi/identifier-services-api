import type { Generated, Updateable, JSONColumnType, Insertable, Selectable } from 'kysely';

export interface MonographPublisherContactPerson {
  name: string;
  email: string;
}

export interface MonographPublisher {
  id: Generated<number>;
  official_name: string;
  other_names: JSONColumnType<string[]>;
  previous_names: JSONColumnType<string[]>;
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  www: string | null;
  lang_code: string;
  contact_persons: JSONColumnType<MonographPublisherContactPerson[]>;
  additional_info: string | null;
  year_quitted: number | null;
  has_quitted: boolean;
  frequency_current: string | null;
  frequency_next: string | null;
  affiliate_of: string | null;
  affiliates: string | null;
  distributor_of: string | null;
  distributors: string | null;
  classifications: JSONColumnType<string[]>;
  classification_other: string | null;
  promote_sorting: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublisherInsert = Insertable<MonographPublisher>;
export type MonographPublisherUpdate = Updateable<MonographPublisher>;
export type MonographPublisherSelect = Selectable<MonographPublisher>;

export interface MonographPublisherReadAdmin extends MonographPublisherSelect {
  isbn_publisher_ranges: {
    id: number;
    publisher_identifier: string;
  }[];
}

export interface MonographPublisherReadGuest extends Omit<
  MonographPublisherSelect,
  | 'email'
  | 'lang_code'
  | 'contact_persons'
  | 'additional_info'
  | 'year_quitted'
  | 'frequency_current'
  | 'frequency_next'
  | 'affiliate_of'
  | 'affiliates'
  | 'distributor_of'
  | 'distributors'
  | 'classifications'
  | 'classification_other'
  | 'promote_sorting'
  | 'created'
  | 'created_by'
  | 'modified'
  | 'modified_by'
> {
  isbn_publisher_ranges: {
    publisher_identifier: string;
  }[];
}

export type MonographPublisherReadAutocomplete = Omit<
  MonographPublisherReadGuest,
  'address' | 'zip' | 'city' | 'phone' | 'www' | 'has_quitted' | 'isbn_publisher_ranges'
>;
