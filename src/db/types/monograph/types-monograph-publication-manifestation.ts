import type { Generated, Updateable, Insertable, Selectable, JSONColumnType } from 'kysely';

import type { MonographAuthor } from './types-monograph-author.ts';

export interface MonographSeriesInformation {
  name: string;
  issn: string | null;
  volume: string | null;
}

export interface MonographPrintingInformation {
  printing_number: number;
  printing_house: string | null;
  printing_house_city: string | null;
  copies: string | null;
}

export interface MonographPublicationManifestation {
  id: Generated<number>;
  monograph_publication_expression_id: number;
  monograph_publication_request_id: number | null;
  manifestation_type: string;
  manifestation_type_other: string | null;
  manifestation_edition: string | null;
  map_scale: string | null;
  authors: JSONColumnType<MonographAuthor[]>;
  publication_year: string | null;
  publication_month: string | null;
  series: JSONColumnType<MonographSeriesInformation[]>;
  printing_information: JSONColumnType<MonographPrintingInformation[]>;
  cancelled: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublicationManifestationInsert = Insertable<MonographPublicationManifestation>;
export type MonographPublicationManifestationUpdate = Updateable<MonographPublicationManifestation>;
export type MonographPublicationManifestationSelect = Selectable<MonographPublicationManifestation>;
