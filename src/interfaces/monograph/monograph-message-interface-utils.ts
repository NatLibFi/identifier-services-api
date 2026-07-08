import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';

import { readMonographPublisher } from './monograph-publisher-interface.ts';
import { readIsbnPublisherRange } from './isbn-publisher-range-interface.ts';
import { getMonographManifestationRelations } from './monograph-publication-manifestation-interface.ts';

import { MONOGRAPH_MANIFESTATION_TYPES, MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

import type { ValidatedMonographPublicationManifestationAdminRead } from '../../dtl/monograph/monograph-publication-manifestation-dtl.ts';

interface MessageRelations {
  monograph_publisher_id: number;
  isbn_publisher_range_id?: number;
  ismn_publisher_range_id?: number;
  manifestation_ids?: number[];
}

export async function sanityCheckMessageRelations(params: MessageRelations) {
  const { monograph_publisher_id, isbn_publisher_range_id, manifestation_ids } = params;

  // Note: all getters return 404 in case entity is not found
  const publisher = await readMonographPublisher(monograph_publisher_id);

  let isbnPublisherRange;
  let expressionInfo;
  let requestId;

  if (isbn_publisher_range_id) {
    isbnPublisherRange = await readIsbnPublisherRange(isbn_publisher_range_id);
  }

  // TODO: ismn publisher range

  if (isbnPublisherRange && isbnPublisherRange.monograph_publisher_id !== publisher.id) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN publisher range id ${isbn_publisher_range_id} does not belong to monograph publisher id ${monograph_publisher_id}.`,
    );
  }

  if (manifestation_ids && manifestation_ids.length > 0) {
    const manifestationInfo = await Promise.all(
      manifestation_ids.map(async (mid) => await getMonographManifestationRelations(mid)),
    );

    const invalidManifestation = manifestationInfo.find((m) => m.publisherId !== monograph_publisher_id);

    if (invalidManifestation) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Manifestation id ${invalidManifestation.manifestationId} does not belong to monograph publisher id ${monograph_publisher_id}.`,
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

    const manifestation = manifestationInfo[0];
    if (!manifestation) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `No expression information could be derived from manifestations.`,
      );
    }

    expressionInfo = {
      expressionTitle: manifestation.expressionTitle,
      expressionSubtitle: manifestation.expressionSubtitle,
    };

    requestId = manifestation.requestId;
  }

  return {
    expressionInfo,
    requestId,
  };
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

export async function getInitialPublisherIdentifier(
  isbnPublisherRangeId: number | null,
  ismnPublisherRangeId: number | null,
): Promise<string | null> {
  if (!isbnPublisherRangeId && !ismnPublisherRangeId) {
    return null;
  }

  if (isbnPublisherRangeId && ismnPublisherRangeId) {
    throw new Error('Publisher identifier cannot be of both type: ISBN and ISMN');
  }

  if (isbnPublisherRangeId) {
    const result = await readIsbnPublisherRange(isbnPublisherRangeId);
    return result.publisher_identifier;
  }

  // TODO: ISMN
  return null;
}

interface ExpressionInfo {
  title: string;
  subtitle: string | null;
}

export interface PublisherMessageInfo {
  officialName: string;
  address: string;
  zip: string;
  city: string;
}

interface ConstructedMessage {
  subject: string;
  body: string;
}

function constructIdentifierAssignedMessage(
  templateBody: string,
  templateSubject: string,
  langCode: string,
  manifestations?: ValidatedMonographPublicationManifestationAdminRead[],
  expressionInfo?: ExpressionInfo | null,
): ConstructedMessage {
  if (!manifestations || !expressionInfo) {
    throw new Error(
      'Message regarding identifier assignation cannot be constructed without manifestation and expression information',
    );
  }

  // All manifestations need to contain identifier
  const manifestationWithoutIdentifier = manifestations.find((m) => m.identifier === null);

  if (manifestationWithoutIdentifier) {
    throw new Error(
      `Manifestation id ${manifestationWithoutIdentifier.id} does not have identifier assigned. Refusing to add to message.`,
    );
  }

  let body = templateBody;
  let subject = templateSubject;

  // Process subject placeholders
  subject = subject.replace('#TITLE#', expressionInfo.title);

  // Process body placeholders
  const manifestationIdentifierStr = manifestations
    .map((m) => `${m.identifier} (${translateManifestationType(m.manifestation_type, langCode)})`)
    .join('\n');

  body = body.replace('#TITLE#', expressionInfo.title);
  body = body.replace('#SUBTITLE#', expressionInfo.subtitle || '');
  body = body.replace('#IDENTIFIERS#', manifestationIdentifierStr);

  return { body, subject };
}

function constructMonographPublisherRegisteredMessage(
  templateBody: string,
  templateSubject: string,
  publisherIdentifier?: string,
): ConstructedMessage {
  let body = templateBody;
  const subject = templateSubject;

  if (!publisherIdentifier) {
    throw new Error('Cannot construct publisher registry join message without publisher identifier information');
  }

  body = body.replace('#IDENTIFIER#', publisherIdentifier);

  return { body, subject };
}

function constructIdentifierListLinkMessage(
  templateBody: string,
  templateSubject: string,
  isbnPublisherRangeId: number | null,
  ismnPublisherRangeId: number | null,
): ConstructedMessage {
  const uiUrl = 'https://tunnisteportaali.kansalliskirjasto.fi';

  let body = templateBody;
  const subject = templateSubject;

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

  return { body, subject };
}

// Message template construction wrapper
interface ConstructMonographMessageParams {
  messageType: string;
  langCode: string;
  publisherInfo: PublisherMessageInfo;
  recipient: string;
  sender: string;
  isbnPublisherRangeId: number | null;
  ismnPublisherRangeId: number | null;
  expressionInfo?: ExpressionInfo | null;
  manifestations?: ValidatedMonographPublicationManifestationAdminRead[];
}

export async function constructMonographMessage(
  constructMonographMessageParams: ConstructMonographMessageParams,
): Promise<ConstructedMessage> {
  const {
    messageType,
    langCode,
    publisherInfo,
    recipient,
    sender,
    isbnPublisherRangeId,
    ismnPublisherRangeId,
    expressionInfo,
    manifestations,
  } = constructMonographMessageParams;

  const db = getKysely();
  let result: ConstructedMessage;

  // Find template
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

  const identifierAssignedMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_ASSIGNMENT,
    MONOGRAPH_MESSAGE_TYPES.ISMN_ASSIGNMENT,
  ];
  const publisherRegistryJoinedMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
    MONOGRAPH_MESSAGE_TYPES.ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
  ];
  const listDeliveryMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_LIST_DELIVERY,
    MONOGRAPH_MESSAGE_TYPES.ISMN_LIST_DELIVERY,
  ];

  if (identifierAssignedMessageTypes.includes(messageType)) {
    result = constructIdentifierAssignedMessage(
      messageTemplate.body,
      messageTemplate.subject,
      langCode,
      manifestations,
      expressionInfo,
    );
  } else if (publisherRegistryJoinedMessageTypes.includes(messageType)) {
    const publisherIdentifier = await getInitialPublisherIdentifier(isbnPublisherRangeId, ismnPublisherRangeId);
    if (!publisherIdentifier) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'Not found',
        `Could not find publisher identifier with given parameters (isbnPublisherRangeId: ${isbnPublisherRangeId}, ismnPublisherRangeId: ${ismnPublisherRangeId}).`,
      );
    }

    result = constructMonographPublisherRegisteredMessage(
      messageTemplate.body,
      messageTemplate.subject,
      publisherIdentifier,
    );
  } else if (listDeliveryMessageTypes.includes(messageType)) {
    result = constructIdentifierListLinkMessage(
      messageTemplate.body,
      messageTemplate.subject,
      isbnPublisherRangeId,
      ismnPublisherRangeId,
    );
  } else {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Unsupported message type: ${messageType}.`,
    );
  }

  // Following replacements are done for all messages
  result.body = result.body.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
  result.body = result.body.replace('#USER#', sender);
  result.body = result.body.replace('#EMAIL#', recipient);

  result.body = result.body.replace('#PUBLISHER#', publisherInfo.officialName);
  result.body = result.body.replace(
    '#ADDRESS#',
    `${publisherInfo.address}\n${publisherInfo.zip} ${publisherInfo.city}`,
  );

  // Prefix both subject and body if sending message from other than production environment
  const isProd = process.env['NODE_ENV'] === 'production';
  if (!isProd) {
    result.subject = `TESTI/TEST MESSAGE ${result.subject}`;
    result.body = `Tämä viesti on testijärjestelmästä / This message is from test system.\n\n${result.body}`;
  }

  return result;
}
