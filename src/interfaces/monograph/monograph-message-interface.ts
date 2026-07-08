import HttpStatus from 'http-status';

import { constructMonographMessage, sanityCheckMessageRelations } from './monograph-message-template-utils.ts';

import { ApiError } from '../../utils/api-error.ts';
import { getApplicationLogger } from '../../utils/logging.ts';

import type { CreateMonographMessageFromTemplate } from '../../validations/monograph/monograph-message-validation.ts';
import type { MonographPublisherConfiguration } from '../../app.ts';
import type { RequestUser } from '../../generic-types.ts';

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createMonographMessageInterface(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  async function createFromTemplate(createOpt: CreateMonographMessageFromTemplate, user: RequestUser) {
    const logger = getApplicationLogger();

    const {
      message_type,
      isbn_publisher_range_id,
      ismn_publisher_range_id,
      monograph_publisher_id,
      manifestation_ids,
    } = createOpt;

    // Sanity check every relation (DO NOT REMOVE THIS GUARD AS MESSAGE CONSTUCTORS ASSUME THIS IS RUN FIRST!) :
    // - verifies all manifestations belongs to same request and expression
    // - verifies given publisher ranges belong to given publisher
    await sanityCheckMessageRelations({
      monographPublisherId: monograph_publisher_id,
      isbnPublisherRangeId: isbn_publisher_range_id,
      ismnPublisherRangeId: ismn_publisher_range_id,
      manifestationIds: manifestation_ids,
    });

    // Craft message based on given information now that it has been established all relations are valid
    let result;

    try {
      result = await constructMonographMessage({
        messageType: message_type,
        monographPublisherId: monograph_publisher_id,
        isSelfPublisher: monographPublisherConfiguration.SELF_PUBLISHER_ID === monograph_publisher_id,
        isbnPublisherRangeId: isbn_publisher_range_id || null,
        ismnPublisherRangeId: ismn_publisher_range_id || null,
        manifestationIds: manifestation_ids,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        logger.error(`Error occurred when attempting to load message template: ${error.message}`);
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Could not load message template due to unexpected problem. Please contact system administration.',
      );
    }

    // Sanity check: recipient cannot be empty at this point
    if (!result.messagePublisher.recipient || result.messagePublisher.recipient.length === 0) {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        'Could not find email address to send information to. Please check publisher or publication request contact information.',
      );
    }

    // Replacements that are shared between all templates are done here
    result.body = result.body.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
    result.body = result.body.replace('#USER#', user.name);
    result.body = result.body.replace('#EMAIL#', result.messagePublisher.recipient);

    result.body = result.body.replace('#PUBLISHER#', result.messagePublisher.officialName);
    result.body = result.body.replace(
      '#ADDRESS#',
      `${result.messagePublisher.address}\n${result.messagePublisher.zip} ${result.messagePublisher.city}`,
    );

    // Prefix both subject and body if sending message from other than production environment
    const isProd = process.env['NODE_ENV'] === 'production';
    if (!isProd) {
      result.subject = `TESTI/TEST MESSAGE ${result.subject}`;
      result.body = `Tämä viesti on testijärjestelmästä / This message is from test system.\n\n${result.body}`;
    }

    return {
      message_type,
      monograph_publisher_id,
      monograph_publication_request_id: result.monograph_publication_request_id,
      isbn_publisher_range_id: result.isbn_publisher_range_id,
      ismn_publisher_range_id: result.ismn_publisher_range_id,
      manifestation_ids: manifestation_ids ?? [],
      recipient: result.messagePublisher.recipient,
      subject: result.subject,
      body: result.body,
    };
  }

  return {
    createFromTemplate,
  };
}
