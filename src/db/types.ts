import type { IsbnRange } from './types/monograph/types-isbn-range.ts';
import type { MonographPublisher } from './types/monograph/types-monograph-publisher.ts';

export interface Database {
  isbn_range: IsbnRange;
  monograph_publisher: MonographPublisher;
}
