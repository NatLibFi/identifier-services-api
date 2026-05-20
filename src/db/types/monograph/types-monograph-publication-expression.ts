import type { Generated, Updateable, Insertable, Selectable, JSONColumnType } from 'kysely';
import type { MonographAuthor } from './types-monograph-author.ts';

export interface MonographPublicationExpression {
  id: Generated<number>;
  monograph_publication_id: number;
  expression_type: string;
  expression_language: string;
  authors: JSONColumnType<MonographAuthor[]>;
  title: string;
  subtitle: string | null;
  map_scale: string | null;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublicationExpressionInsert = Insertable<MonographPublicationExpression>;
export type MonographPublicationExpressionUpdate = Updateable<MonographPublicationExpression>;
export type MonographPublicationExpressionSelect = Selectable<MonographPublicationExpression>;
