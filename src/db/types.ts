import type { IsbnIdentifier } from './types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRange } from './types/monograph/types-isbn-publisher-range.ts';
import type { IsbnRange } from './types/monograph/types-isbn-range.ts';

import type { IsmnIdentifier } from './types/monograph/types-ismn-identifier.ts';
import type { IsmnPublisherRange } from './types/monograph/types-ismn-publisher-range.ts';
import type { IsmnRange } from './types/monograph/types-ismn-range.ts';

import type { MonographMessage } from './types/monograph/types-monograph-message.ts';
import type { MonographMessagePublicationManifestation } from './types/monograph/types-monograph-message-publication-manifestation.ts';

import type { MonographPublisher } from './types/monograph/types-monograph-publisher.ts';
import type { MonographPublisherRequest } from './types/monograph/types-monograph-publisher-request.ts';
import type { MonographPublisherRequestArchive } from './types/monograph/types-monograph-publisher-request-archive.ts';

import type { MonographPublicationExpression } from './types/monograph/types-monograph-publication-expression.ts';
import type { MonographPublicationManifestation } from './types/monograph/types-monograph-publication-manifestation.ts';
import type { MonographPublicationRequest } from './types/monograph/types-monograph-publication-request.ts';
import type { MonographPublication } from './types/monograph/types-monograph-publication.ts';

import type { MessageTemplate } from './types/message-template.ts';

export interface Database {
  isbn_range: IsbnRange;
  isbn_publisher_range: IsbnPublisherRange;
  isbn_identifier: IsbnIdentifier;

  ismn_range: IsmnRange;
  ismn_publisher_range: IsmnPublisherRange;
  ismn_identifier: IsmnIdentifier;

  monograph_publisher: MonographPublisher;
  monograph_publisher_request: MonographPublisherRequest;
  monograph_publisher_request_archive: MonographPublisherRequestArchive;

  monograph_publication: MonographPublication;
  monograph_publication_request: MonographPublicationRequest;
  monograph_publication_expression: MonographPublicationExpression;
  monograph_publication_manifestation: MonographPublicationManifestation;

  monograph_message: MonographMessage;
  monograph_message_publication_manifestation: MonographMessagePublicationManifestation;

  message_template: MessageTemplate;
}
