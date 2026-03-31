import type { IsbnIdentifier } from './types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRange } from './types/monograph/types-isbn-publisher-range.ts';
import type { IsbnRange } from './types/monograph/types-isbn-range.ts';

import type { MonographPublisher } from './types/monograph/types-monograph-publisher.ts';

export interface Database {
  isbn_range: IsbnRange;
  isbn_publisher_range: IsbnPublisherRange;
  isbn_identifier: IsbnIdentifier;
  monograph_publisher: MonographPublisher;
}
