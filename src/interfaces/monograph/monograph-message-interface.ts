import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import { readMonographPublicationManifestation } from './monograph-publication-manifestation-interface.ts';
import { readMonographPublicationRequest } from './monograph-publication-request-interface.ts';
import {
  constructMonographMessage,
  sanityCheckMessageRelations,
  type PublisherMessageInfo,
} from './monograph-message-interface-utils.ts';
import { readMonographPublicationExpression } from './monograph-publication-expression-interface.ts';
import { getMonographPublisherIsbnRanges } from './monograph-publisher-interface-utils.ts';

import type { CreateMonographMessageFromTemplate } from '../../validations/monograph/monograph-message-validation.ts';
import type { MonographPublisherConfiguration } from '../../app.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { MessageTemplateSelect } from '../../db/types/message-template.ts';

async function readMonographPublicationMessageTemplate(
  messageType: string,
  langCode: string,
): Promise<MessageTemplateSelect | undefined> {
  const db = getKysely();
  return await db
    .selectFrom('message_template')
    .selectAll()
    .where('message_type', '=', messageType)
    .where('lang_code', '=', langCode)
    .executeTakeFirst();
}

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createMonographMessageInterface(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  async function createFromTemplate(createOpt: CreateMonographMessageFromTemplate, user: RequestUser) {
    const db = getKysely();
    const { type: messageType, ...relations } = createOpt;
    const { isbn_publisher_range_id, monograph_publisher_id, manifestation_ids } = relations;

    // Gather information of publisher
    const publicationPublisher = await db
      .selectFrom('monograph_publisher')
      .selectAll()
      .where('id', '=', monograph_publisher_id)
      .execute();
    const validatedPublisher = validateGetById(publicationPublisher);

    let langCode = validatedPublisher.lang_code;
    let messagePublisher: PublisherMessageInfo = {
      officialName: validatedPublisher.official_name,
      address: validatedPublisher.address || '',
      zip: validatedPublisher.zip || '',
      city: validatedPublisher.city || '',
    };

    // Default recipient to first contact email of publisher. Secondarily use publisher common email.
    // Note that for self-publishing entries this will get overwritten with publication request email
    const publisherFirstEmailContact = validatedPublisher.contact_persons.find(
      (p) => typeof p.email === 'string' && p.email.length > 0,
    );
    let recipient = publisherFirstEmailContact ? publisherFirstEmailContact.email : validatedPublisher.email;

    const manifestations = manifestation_ids
      ? await Promise.all(manifestation_ids.map(async (mid: number) => readMonographPublicationManifestation(mid)))
      : [];
    const [firstManifestation] = manifestations;

    // Note: sanityCheckMessageRelations confirms all manifestations defined belong to same expression
    const expressionInfoRaw = firstManifestation
      ? await readMonographPublicationExpression(firstManifestation.monograph_publication_expression_id)
      : null;

    const expressionInfo = expressionInfoRaw
      ? { title: expressionInfoRaw.title, subtitle: expressionInfoRaw.subtitle }
      : null;

    // In case the publication was self-publication, use publication request information instead
    const isSelfPublishing = monograph_publisher_id === monographPublisherConfiguration.SELF_PUBLISHER_ID;

    if (isSelfPublishing && !firstManifestation) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'Not found',
        'Could not find manifestation from which to derive self-publisher request information',
      );
    }

    if (isSelfPublishing) {
      const monographPublicationRequest = await readMonographPublicationRequest(
        // @ts-expect-error TS cannot understand we have verified first manifestation exists
        firstManifestation.monograph_publication_request_id,
      );

      messagePublisher = {
        officialName: monographPublicationRequest.official_name,
        address: monographPublicationRequest.address || '',
        zip: monographPublicationRequest.zip || '',
        city: monographPublicationRequest.city || '',
      };

      recipient = monographPublicationRequest.email ? monographPublicationRequest.email : '';
      langCode = monographPublicationRequest.lang_code;
    }

    // Sanity check: recipient cannot be empty at this point
    if (!recipient || recipient.length === 0) {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        'Could not find email address to send information to. Please check publisher or publication request contact information.',
      );
    }

    const messageTemplate = await readMonographPublicationMessageTemplate(messageType, langCode);
    if (!messageTemplate) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'Not found',
        `Message template for type ${messageType} using lang_code ${langCode} could not be found. Please contact system administrator.`,
      );
    }

    // Sanity check every relation
    await sanityCheckMessageRelations(relations);

    // Find last given publisher range if message type is PUBLISHER_REGISTRY_JOINED
    let isbnPublisherRangeId = isbn_publisher_range_id ?? null;
    // TODO: ISMN;

    if (messageType === MONOGRAPH_MESSAGE_TYPES.PUBLISHER_REGISTRY_JOINED) {
      const publisherIsbnRanges = await getMonographPublisherIsbnRanges(monograph_publisher_id);
      isbnPublisherRangeId = publisherIsbnRanges[0]?.id ?? null;
    }

    // Construct message body
    const { body, subject } = await constructMonographMessage({
      messageType,
      langCode,
      publisherInfo: messagePublisher,
      recipient,
      sender: user.name,
      isbnPublisherRangeId,
      ismnPublisherRangeId: null, // TODO: ismn
      manifestations,
      expressionInfo,
    });

    return {
      monograph_publisher_id,
      isbn_publisher_range_id: isbnPublisherRangeId,
      ismn_publisher_range_id: null, // TODO: ismn
      manifestation_ids: manifestation_ids ?? [],
      recipient,
      subject,
      body,
    };
  }

  return {
    createFromTemplate,
  };
}
