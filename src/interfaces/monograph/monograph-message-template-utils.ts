import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';

import { readMonographPublicationExpression } from './monograph-publication-expression-interface.ts';
import { readMonographPublicationRequest } from './monograph-publication-request-interface.ts';
import { readMonographPublisher } from './monograph-publisher-interface.ts';
import { readIsbnPublisherRange } from './isbn-publisher-range-interface.ts';
import {
  getMonographManifestationRelations,
  readMonographPublicationManifestation,
} from './monograph-publication-manifestation-interface.ts';

import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import { MONOGRAPH_MANIFESTATION_TYPES, MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';
import { getMonographPublisherIsbnRanges } from './monograph-publisher-interface-utils.ts';
import { readIsmnPublisherRange } from './ismn-publisher-range-interface.ts';

interface MessageRelations {
  monographPublisherId: number;
  monographPublicationRequestId?: number | null;
  isbnPublisherRangeId?: number | null;
  ismnPublisherRangeId?: number | null;
  manifestationIds?: number[];
}

export async function sanityCheckMessageRelations(params: MessageRelations) {
  const {
    monographPublisherId,
    monographPublicationRequestId,
    isbnPublisherRangeId,
    ismnPublisherRangeId,
    manifestationIds,
  } = params;

  // Note: all getters return 404 in case entity is not found
  const publisher = await readMonographPublisher(monographPublisherId);

  let monographPublicationRequest;
  let isbnPublisherRange;
  let ismnPublisherRange;

  if (monographPublicationRequestId) {
    monographPublicationRequest = await readMonographPublicationRequest(monographPublicationRequestId);

    // Verify request belongs to given publisher
    if (monographPublicationRequest.monograph_publisher_id !== monographPublisherId) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Monograph publication request id ${monographPublicationRequestId} does not belong to monograph publisher id ${monographPublisherId}.`,
      );
    }
  }

  if (isbnPublisherRangeId) {
    isbnPublisherRange = await readIsbnPublisherRange(isbnPublisherRangeId);

    if (isbnPublisherRange.monograph_publisher_id !== publisher.id) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISBN publisher range id ${isbnPublisherRangeId} does not belong to monograph publisher id ${monographPublisherId}.`,
      );
    }
  } else if (ismnPublisherRangeId) {
    ismnPublisherRange = await readIsmnPublisherRange(ismnPublisherRangeId);

    if (ismnPublisherRange.monograph_publisher_id !== publisher.id) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISMN publisher range id ${ismnPublisherRangeId} does not belong to monograph publisher id ${monographPublisherId}.`,
      );
    }
  }

  if (manifestationIds && manifestationIds.length > 0) {
    const manifestationInfo = await Promise.all(
      manifestationIds.map(async (mid) => await getMonographManifestationRelations(mid)),
    );

    // Verify all manifestations belong to given monograph publisher
    const invalidManifestation = manifestationInfo.find((m) => m.publisherId !== monographPublisherId);

    if (invalidManifestation) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation id ${invalidManifestation.manifestationId} does not belong to monograph publisher id ${monographPublisherId}.`,
      );
    }

    // Disallow sending messages regarding manifestations that do not belong to any request and require they belong to same request
    const nonRequestManifestations = manifestationInfo.filter((m) => m.requestId === null);
    const requestManifestationIds = manifestationInfo
      .map((m) => m.requestId)
      .filter((m) => m !== null)
      .reduce((p: number[], n: number) => (p.includes(n) ? p : p.concat(n)), []);

    if (nonRequestManifestations.length > 0) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'There are manifestations that do not belong to any monograph publication request.',
      );
    }

    if (requestManifestationIds.length !== 1) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'You may only send email regarding manifestations of a single monograph publication request.',
      );
    }

    // Validate request id matches with given request id if it was given
    if (requestManifestationIds[0] !== monographPublicationRequestId) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Given monograph publication request id ${monographPublicationRequestId} does not match with request id found from manifestations (found id ${requestManifestationIds[0]})`,
      );
    }

    // Validate all manifestations belong expression
    const manifestationWithoutExpression = manifestationInfo.find((m) => m.expressionId === null);
    if (manifestationWithoutExpression) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation ${manifestationWithoutExpression.manifestationId} does not belong to any expression. This shoult not ever have happened.`,
      );
    }

    // Validate all manifestations belong to exactly same expression
    // Note: filtering is just for typing purposes. Not having null expressionId is already confirmed separately.
    const uniqExpressionIds = manifestationInfo
      .map((m) => m.expressionId)
      .filter((m) => m !== null)
      .reduce((p: number[], n: number) => (p.includes(n) ? p : p.concat(n)), []);

    if (uniqExpressionIds.length !== 1) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Selected manifestations need to belong to exactly one expression for purposes of sending a message.`,
      );
    }

    const [firstManifestation] = manifestationInfo;
    if (!firstManifestation) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `No expression information could be derived from manifestations.`,
      );
    }

    // Validate all manifestations have identifier assigned
    const manifestationWithoutIdentifier = manifestationInfo.find((m) => !m.isbnIdentifier && !m.ismnIdentifier);
    if (manifestationWithoutIdentifier) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation id ${manifestationWithoutIdentifier.manifestationId} does not have identifier assigned.`,
      );
    }

    // Sanity check: no both ISBN and ISMN should ever be assigned to one manifestation
    const manifestationWithTwoIdentifiers = manifestationInfo.find((m) => m.isbnIdentifier && m.ismnIdentifier);
    if (manifestationWithTwoIdentifiers) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation id ${manifestationWithTwoIdentifiers.manifestationId} has both ISBN and ISMN identifiers assigned. This should not happen! Please contact system administrator.`,
      );
    }

    // Validate no manifestation is cancelled
    const manifestationCancelled = manifestationInfo.find((m) => m.manifestationCancelled);
    if (manifestationCancelled) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation id ${manifestationCancelled.manifestationId} has been cancelled.`,
      );
    }
  }

  return;
}

export function translateManifestationType(manifestationType: string, langCode: string) {
  const translations = {
    'fi-FI': {
      [MONOGRAPH_MANIFESTATION_TYPES.PAPERBACK]: 'pehmeäkantinen',
      [MONOGRAPH_MANIFESTATION_TYPES.HARDBACK]: 'kovakantinen',
      [MONOGRAPH_MANIFESTATION_TYPES.SPIRAL_BINDING]: 'kierreselkä',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER_PRINT]: 'muu (painettu)',
      [MONOGRAPH_MANIFESTATION_TYPES.PDF]: 'PDF',
      [MONOGRAPH_MANIFESTATION_TYPES.EPUB]: 'EPUB',
      [MONOGRAPH_MANIFESTATION_TYPES.CD_ROM]: 'CD-ROM',
      [MONOGRAPH_MANIFESTATION_TYPES.MP3]: 'MP3',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER]: 'muu (sähköinen)',
      [MONOGRAPH_MANIFESTATION_TYPES.MULTIPART_MONOGRAPH]: 'moniosaisen julkaisun kokonaisuus',
    },
    'sv-SE': {
      [MONOGRAPH_MANIFESTATION_TYPES.PAPERBACK]: 'mjuka pärmar',
      [MONOGRAPH_MANIFESTATION_TYPES.HARDBACK]: 'hårda pärmar',
      [MONOGRAPH_MANIFESTATION_TYPES.SPIRAL_BINDING]: 'spiralrygg',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER_PRINT]: 'annan (tryckt)',
      [MONOGRAPH_MANIFESTATION_TYPES.PDF]: 'PDF',
      [MONOGRAPH_MANIFESTATION_TYPES.EPUB]: 'EPUB',
      [MONOGRAPH_MANIFESTATION_TYPES.CD_ROM]: 'CD-ROM',
      [MONOGRAPH_MANIFESTATION_TYPES.MP3]: 'MP3',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER]: 'annan (webpublikation)',
      [MONOGRAPH_MANIFESTATION_TYPES.MULTIPART_MONOGRAPH]: '<todo ruotsinkielinen käännös moniosaiselle monografialle>',
    },
    'en-GB': {
      [MONOGRAPH_MANIFESTATION_TYPES.PAPERBACK]: 'softcover',
      [MONOGRAPH_MANIFESTATION_TYPES.HARDBACK]: 'hardcover',
      [MONOGRAPH_MANIFESTATION_TYPES.SPIRAL_BINDING]: 'spiral-bound',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER_PRINT]: 'other (printed)',
      [MONOGRAPH_MANIFESTATION_TYPES.PDF]: 'PDF',
      [MONOGRAPH_MANIFESTATION_TYPES.EPUB]: 'EPUB',
      [MONOGRAPH_MANIFESTATION_TYPES.CD_ROM]: 'CD-ROM',
      [MONOGRAPH_MANIFESTATION_TYPES.MP3]: 'MP3',
      [MONOGRAPH_MANIFESTATION_TYPES.OTHER]: 'other (electronical)',
      [MONOGRAPH_MANIFESTATION_TYPES.MULTIPART_MONOGRAPH]:
        '<todo englanninkielinen käännös moniosaiselle monografialle>',
    },
  };

  if (!Object.keys(translations).includes(langCode)) {
    throw new Error('Language code for translating email type could not be found');
  }

  // @ts-expect-error TODO typing
  if (!Object.keys(translations[langCode]).includes(manifestationType)) {
    throw new Error('Identifier type translating email type could not be found');
  }

  // @ts-expect-error TODO typing
  return translations[langCode][manifestationType];
}

interface PublisherMessageInfo {
  id: number;
  officialName: string;
  address: string;
  zip: string;
  city: string;
  langCode: string;
  recipient: string;
}

interface ConstructedMessage {
  messagePublisher: PublisherMessageInfo;
  monograph_publication_request_id: number | null;
  isbn_publisher_range_id: number | null;
  ismn_publisher_range_id: number | null;
  subject: string;
  body: string;
}

async function constructIdentifierAssignedMessage(
  messageType: string,
  messagePublisher: PublisherMessageInfo,
  isSelfPublisher: boolean,
  manifestationIds?: number[],
): Promise<ConstructedMessage> {
  // Note: assumes sanityCheckMessageRelations will be ran to confirm associations
  const publisherInfo = { ...messagePublisher }; // mechanism to allow overriding publisher information for self-publishers

  const manifestations = manifestationIds
    ? await Promise.all(manifestationIds.map(async (mid: number) => readMonographPublicationManifestation(mid)))
    : [];

  const [firstManifestation] = manifestations;

  if (!manifestations || manifestations.length === 0 || !firstManifestation) {
    throw new Error('Message regarding identifier assignation cannot be constructed without manifestations');
  }

  const publicationRequestId = firstManifestation.monograph_publication_request_id;
  if (!publicationRequestId) {
    throw new Error(
      'Message regarding identifier assignation cannot be constructed without manifestations being associated with monograph publication request',
    );
  }

  // All manifestations need to contain identifier
  // Note this function relies on assumption that guards relating to entity relations (e.g., confirming manifestations belong to same expression and publicatio request) have already been satisfied by sanityCheckMessageRelations
  const manifestationWithoutIdentifier = manifestations.find((m) => m.identifier === null);

  if (manifestationWithoutIdentifier) {
    throw new Error(
      `Manifestation id ${manifestationWithoutIdentifier.id} does not have identifier assigned. Refusing to add to message.`,
    );
  }

  const expression = await readMonographPublicationExpression(firstManifestation.monograph_publication_expression_id);
  const publicationRequest = await readMonographPublicationRequest(publicationRequestId);

  if (!publicationRequest.monograph_publisher_id) {
    throw new Error(
      `Publication request id ${publicationRequest.id} does not have publisher assigned. Refusing to craft message related to this publication request.`,
    );
  }

  // Override current message publisher with request information
  if (isSelfPublisher) {
    publisherInfo.officialName = publicationRequest.official_name;
    publisherInfo.address = publicationRequest.address || '';
    publisherInfo.zip = publicationRequest.zip || '';
    publisherInfo.city = publicationRequest.city || '';
    publisherInfo.langCode = publicationRequest.lang_code;

    publisherInfo.recipient = publicationRequest.email || '';
  }

  const messageTemplate = await getMessageTemplate(messageType, publisherInfo.langCode);
  let body = messageTemplate.body;
  let subject = messageTemplate.subject;

  // Process subject placeholders
  subject = subject.replace('#TITLE#', expression.title);

  // Process body placeholders
  const manifestationIdentifierStr = manifestations
    .map((m) => `${m.identifier} (${translateManifestationType(m.manifestation_type, publisherInfo.langCode)})`)
    .join('\n');

  body = body.replace('#TITLE#', expression.title);
  body = body.replace('#SUBTITLE#', expression.subtitle || '');
  body = body.replace('#IDENTIFIERS#', manifestationIdentifierStr);

  return {
    messagePublisher: publisherInfo,
    monograph_publication_request_id: firstManifestation.monograph_publication_request_id,
    isbn_publisher_range_id: null,
    ismn_publisher_range_id: null,
    body,
    subject,
  };
}

async function constructMonographPublisherRegisteredMessage(
  messageType: string,
  messagePublisher: PublisherMessageInfo,
): Promise<ConstructedMessage> {
  // Note: assumes sanityCheckMessageRelations will be ran to confirm associations
  let publisherIdentifier;
  let isbnPublisherRangeId = null;
  const ismnPublisherRangeId = null;

  const messageTemplate = await getMessageTemplate(messageType, messagePublisher.langCode);

  let body = messageTemplate.body;
  const subject = messageTemplate.subject;

  if (messageType === MONOGRAPH_MESSAGE_TYPES.ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION) {
    const isbnPublisherRange = await getMonographPublisherIsbnRanges(messagePublisher.id);

    // Validate publisher has only one range and that it's of category five
    const cat5PublisherRanges = isbnPublisherRange.filter((v) => v.publisher_identifier.length === 13);
    const cat5PublisherRange = cat5PublisherRanges[0];
    if (cat5PublisherRanges.length !== 1 || !cat5PublisherRange) {
      throw new Error(
        `Publisher needs to have exactly one category 5 publisher range for constructing registration confirmation message`,
      );
    }

    publisherIdentifier = cat5PublisherRange.publisher_identifier;
    isbnPublisherRangeId = cat5PublisherRange.id;
  } else if (messageType === MONOGRAPH_MESSAGE_TYPES.ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION) {
    // TODO: ismn
    throw new Error('ISMN is not yet supported in this function');
  } else {
    throw new Error(
      'You entered a code branch that should be impossible to enter to. Here is an identification code you can pass to system administration: MONO-MSG-1',
    );
  }

  body = body.replace('#IDENTIFIER#', publisherIdentifier);

  return {
    messagePublisher,
    monograph_publication_request_id: null,
    isbn_publisher_range_id: isbnPublisherRangeId,
    ismn_publisher_range_id: ismnPublisherRangeId,
    body,
    subject,
  };
}

async function constructIdentifierListLinkMessage(
  messageType: string,
  messagePublisher: PublisherMessageInfo,
  isbnPublisherRangeId: number | null,
  ismnPublisherRangeId: number | null,
): Promise<ConstructedMessage> {
  // Note: assumes sanityCheckMessageRelations will be ran to confirm associations

  const uiUrl = 'https://tunnisteportaali.kansalliskirjasto.fi';

  const messageTemplate = await getMessageTemplate(messageType, messagePublisher.langCode);
  let body = messageTemplate.body;
  const subject = messageTemplate.subject;

  if (!isbnPublisherRangeId && !ismnPublisherRangeId) {
    throw new Error('Could not construct identifier link as no publisher range id was provided for constructor');
  }

  if (isbnPublisherRangeId && ismnPublisherRangeId) {
    throw new Error(
      'Could not construct identifier link as both types of publisher range id was provided for constructor (ISBN and ISMN)',
    );
  }

  if (isbnPublisherRangeId) {
    body = body.replace('#IDENTIFIERS#', `${uiUrl}/monograph/isbn-publisher-ranges/${isbnPublisherRangeId}`);
  } else if (ismnPublisherRangeId) {
    body = body.replace('#IDENTIFIERS#', `${uiUrl}/monograph/ismn-publisher-ranges/${ismnPublisherRangeId}`);
  }

  return {
    messagePublisher,
    monograph_publication_request_id: null,
    isbn_publisher_range_id: isbnPublisherRangeId,
    ismn_publisher_range_id: ismnPublisherRangeId,
    body,
    subject,
  };
}

// Message template construction wrapper
interface ConstructMonographMessageParams {
  messageType: string;
  monographPublisherId: number;
  isSelfPublisher: boolean;
  isbnPublisherRangeId: number | null;
  ismnPublisherRangeId: number | null;
  manifestationIds?: number[];
}

export async function constructMonographMessage(
  constructMonographMessageParams: ConstructMonographMessageParams,
): Promise<ConstructedMessage> {
  const {
    messageType,
    monographPublisherId,
    isSelfPublisher,
    isbnPublisherRangeId,
    ismnPublisherRangeId,
    manifestationIds,
  } = constructMonographMessageParams;

  const db = getKysely();

  // Gather information of publisher (common for all messages)
  const publicationPublisher = await db
    .selectFrom('monograph_publisher')
    .selectAll()
    .where('id', '=', monographPublisherId)
    .execute();

  const validatedPublisher = validateGetById(publicationPublisher);

  const messagePublisher: PublisherMessageInfo = {
    id: validatedPublisher.id,
    officialName: validatedPublisher.official_name,
    address: validatedPublisher.address || '',
    zip: validatedPublisher.zip || '',
    city: validatedPublisher.city || '',
    langCode: validatedPublisher.lang_code,
    recipient: '',
  };

  // By default the recipient is the first contact email of publisher. If required, fallback to using publisher common email.
  // Note that for self-publishing entries this will always get overwritten with email defined in publication request
  const publisherFirstEmailContact = validatedPublisher.contact_persons.find(
    (p) => typeof p.email === 'string' && p.email.length > 0,
  );

  const preferredPublisherContact = publisherFirstEmailContact
    ? publisherFirstEmailContact.email
    : validatedPublisher.email;
  messagePublisher.recipient = preferredPublisherContact ? preferredPublisherContact : '';

  const identifierAssignedMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_ASSIGNMENT,
    MONOGRAPH_MESSAGE_TYPES.ISMN_ASSIGNMENT,
  ];

  if (identifierAssignedMessageTypes.includes(messageType)) {
    // Note exception on loading message template within the constructor
    // This is due to langCode being determined by request form instead of publisher for self-published books
    return constructIdentifierAssignedMessage(messageType, messagePublisher, isSelfPublisher, manifestationIds);
  }

  const publisherRegistryJoinedMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
    MONOGRAPH_MESSAGE_TYPES.ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
  ];
  const listDeliveryMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_LIST_DELIVERY,
    MONOGRAPH_MESSAGE_TYPES.ISMN_LIST_DELIVERY,
  ];

  if (publisherRegistryJoinedMessageTypes.includes(messageType)) {
    return constructMonographPublisherRegisteredMessage(messageType, messagePublisher);
  }

  if (listDeliveryMessageTypes.includes(messageType)) {
    return constructIdentifierListLinkMessage(
      messageType,
      messagePublisher,
      isbnPublisherRangeId,
      ismnPublisherRangeId,
    );
  }

  // Throw error explicitly on unsupported message type
  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    `Unsupported message type: ${messageType}.`,
  );
}

async function getMessageTemplate(messageType: string, langCode: string) {
  const db = getKysely();

  const messageTemplates = await db
    .selectFrom('message_template')
    .selectAll()
    .where('message_type', '=', messageType)
    .where('lang_code', '=', langCode)
    .execute();

  const [messageTemplate] = messageTemplates;

  if (!messageTemplate) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Could not find template for message type of ${messageType} and language code of ${langCode}.`,
    );
  }

  if (messageTemplates.length > 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Could find more than one template for message type of ${messageType} and language code of ${langCode}.`,
    );
  }

  return messageTemplate;
}
