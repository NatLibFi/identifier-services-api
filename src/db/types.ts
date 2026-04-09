import type { IsbnIdentifier } from './types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRange } from './types/monograph/types-isbn-publisher-range.ts';
import type { IsbnRange } from './types/monograph/types-isbn-range.ts';

import type { MonographPublisher } from './types/monograph/types-monograph-publisher.ts';

import type { MonographPublicationExpression } from './types/monograph/types-monograph-publication-expression.ts';
import type { MonographPublicationManifestation } from './types/monograph/types-monograph-publication-manifestation.ts';
import type { MonographPublicationRequest } from './types/monograph/types-monograph-publication-request.ts';
import type { MonographPublication } from './types/monograph/types-monograph-publication.ts';

export interface Database {
  isbn_range: IsbnRange;
  isbn_publisher_range: IsbnPublisherRange;
  isbn_identifier: IsbnIdentifier;
  monograph_publisher: MonographPublisher;
  monograph_publication: MonographPublication;
  monograph_publication_request: MonographPublicationRequest;
  monograph_publication_expression: MonographPublicationExpression;
  monograph_publication_manifestation: MonographPublicationManifestation;
}
