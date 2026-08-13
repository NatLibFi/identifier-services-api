import type { Generated, Updateable, Insertable, Selectable, JSONColumnType } from 'kysely';

export interface SerialPublicationAssociatedSeries {
  title: string;
  issn: string | null;
}

export interface SerialPublicationPreviousSeries extends SerialPublicationAssociatedSeries {
  last_issue: string | null;
}

export interface SerialPublication {
  id: Generated<number>;
  serial_publication_request_id: number;
  title: string;
  subtitle: string | null;
  place_of_publication: string | null;
  printer: string | null;
  issued_from_year: string | null;
  issued_from_number: string | null;
  frequence: string;
  frequency_other: string | null;
  language: string;
  publication_type: string;
  publication_type_other: string | null;
  medium: string;
  medium_other: string | null;
  url: string | null;
  previous: JSONColumnType<SerialPublicationPreviousSeries[]>;
  main_series: JSONColumnType<SerialPublicationAssociatedSeries[]>;
  subseries: JSONColumnType<SerialPublicationAssociatedSeries[]>;
  another_medium: JSONColumnType<SerialPublicationAssociatedSeries[]>;
  status: string;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type SerialPublicationInsert = Insertable<SerialPublication>;
export type SerialPublicationUpdate = Updateable<SerialPublication>;
export type SerialPublicationSelect = Selectable<SerialPublication>;

export interface SerialPublicationSelectExtended extends SerialPublicationSelect {
  issn_identifier: string | null;
}
