import type { IsbnIdentifier } from './types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRange } from './types/monograph/types-isbn-publisher-range.ts';
import type { IsbnRange } from './types/monograph/types-isbn-range.ts';

import type { IsmnIdentifier } from './types/monograph/types-ismn-identifier.ts';
import type { IsmnPublisherRange } from './types/monograph/types-ismn-publisher-range.ts';
import type { IsmnRange } from './types/monograph/types-ismn-range.ts';

import type { MonographIdentifierBatch } from './types/monograph/types-monograph-identifier-batch.ts';
import type { MonographIdentifierBatchDownload } from './types/monograph/types-monograph-identifier-batch-download.ts';

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

import type { IssnRange } from './types/serial/types-issn-range.ts';
import type { IssnIdentifier } from './types/serial/types-isnn-identifier.ts';

import type { SerialPublisher } from './types/serial/types-serial-publisher.ts';

import type { SerialPublication } from './types/serial/types-serial-publication.ts';
import type { SerialPublicationArchive } from './types/serial/types-serial-publication-archive.ts';

import type { SerialPublicationRequest } from './types/serial/types-serial-publication-request.ts';
import type { SerialPublicationRequestArchive } from './types/serial/types-serial-publication-request-archive.ts';

import type { SerialMessage } from './types/serial/types-serial-message.ts';

export interface Database {
  // Monograph
  isbn_range: IsbnRange;
  isbn_publisher_range: IsbnPublisherRange;
  isbn_identifier: IsbnIdentifier;

  ismn_range: IsmnRange;
  ismn_publisher_range: IsmnPublisherRange;
  ismn_identifier: IsmnIdentifier;

  monograph_identifier_batch: MonographIdentifierBatch;
  monograph_identifier_batch_download: MonographIdentifierBatchDownload;

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

  // Serial
  issn_range: IssnRange;
  issn_identifier: IssnIdentifier;

  serial_publisher: SerialPublisher;

  serial_publication: SerialPublication;
  serial_publication_archive: SerialPublicationArchive;

  serial_publication_request: SerialPublicationRequest;
  serial_publication_request_archive: SerialPublicationRequestArchive;

  serial_message: SerialMessage;
}
