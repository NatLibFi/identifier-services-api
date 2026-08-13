import type { Generated, Updateable, Insertable, Selectable, JSONColumnType } from 'kysely';
import type { SerialPublicationAssociatedSeries, SerialPublicationPreviousSeries } from './types-serial-publication.ts';

export interface SerialPublicationArchive {
  id: Generated<number>;
  serial_publication_id: number;
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
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type SerialPublicationArchiveInsert = Insertable<SerialPublicationArchive>;
export type SerialPublicationArchiveUpdate = Updateable<SerialPublicationArchive>;
export type SerialPublicationArchiveSelect = Selectable<SerialPublicationArchive>;
