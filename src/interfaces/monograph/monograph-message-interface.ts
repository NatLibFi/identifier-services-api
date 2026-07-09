import HttpStatus from 'http-status';

import { constructMonographMessage, sanityCheckMessageRelations } from './monograph-message-template-utils.ts';

import { ApiError } from '../../utils/api-error.ts';
import { getApplicationLogger } from '../../utils/logging.ts';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime } from '../interface-utils/common-interface-utils.ts';
import { sendEmail } from '../interface-utils/email-utils.ts';

import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateMonographMessageFromTemplate,
  SendMonographMessage,
} from '../../validations/monograph/monograph-message-validation.ts';

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createMonographMessageInterface(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  messagingConfiguration: MessagingConfiguration,
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

    // Sanity checks every relation of resulting message (DO NOT REMOVE THIS GUARD AS MESSAGE CONSTUCTORS DO NOT MAKE ANY CHECKS!) :
    // - verifies all manifestations have identifiers and belong to same request and expression
    // - verifies given publisher ranges belong to given publisher
    await sanityCheckMessageRelations({
      monographPublisherId: monograph_publisher_id,
      monographPublicationRequestId: result.monograph_publication_request_id,
      isbnPublisherRangeId: result.isbn_publisher_range_id,
      ismnPublisherRangeId: result.ismn_publisher_range_id,
      manifestationIds: manifestation_ids,
    });

    // Replacements that are shared between all templates are done here
    result.body = result.body.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
    result.body = result.body.replace('#USER#', user.name);
    result.body = result.body.replace('#EMAIL#', result.messagePublisher.recipient);

    result.body = result.body.replace('#PUBLISHER#', result.messagePublisher.officialName);
    result.body = result.body.replace(
      '#ADDRESS#',
      `${result.messagePublisher.address}\n${result.messagePublisher.zip} ${result.messagePublisher.city}`,
    );

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
      lang_code: result.messagePublisher.langCode,
    };
  }

  async function sendMonographMessage(message: SendMonographMessage, user: RequestUser) {
    const {
      message_type,
      monograph_publisher_id,
      monograph_publication_request_id,
      isbn_publisher_range_id,
      ismn_publisher_range_id,
      manifestation_ids,
      body,
      recipient,
      subject,
      lang_code,
    } = message;

    // Do not trust user input even though it should stay the same between loading message template and sending a message
    // Always validate relations before operation
    await sanityCheckMessageRelations({
      monographPublisherId: monograph_publisher_id,
      monographPublicationRequestId: monograph_publication_request_id,
      isbnPublisherRangeId: isbn_publisher_range_id,
      ismnPublisherRangeId: ismn_publisher_range_id,
      manifestationIds: manifestation_ids,
    });

    // Prefix both subject and body if sending message from other than production environment
    let finalSubject = subject;
    let finalBody = body;

    const isProd = process.env['NODE_ENV'] === 'production';
    if (!isProd) {
      finalSubject = `TESTI/TEST MESSAGE ${subject}`;
      finalBody = `Tämä viesti on testijärjestelmästä / This message is from test system.\n\n${body}`;
    }

    // Save to db within transaction
    const db = getKysely();
    const messageId = await db.transaction().execute(async (trx) => {
      // Save message
      const messageSaveResult = await trx
        .insertInto('monograph_message')
        .values({
          message_type,
          monograph_publisher_id,
          monograph_publication_request_id,
          isbn_publisher_range_id,
          ismn_publisher_range_id,
          lang_code,
          subject: finalSubject,
          body: finalBody,
          recipient,
          sent: getCurrentTime(),
          sent_by: user.id,
        })
        .executeTakeFirstOrThrow();

      // Save manifestation associations if there are any
      await Promise.all(
        manifestation_ids.map(async (manifestationId) => {
          await trx
            .insertInto('monograph_message_publication_manifestation')
            .values({
              monograph_message_id: Number(messageSaveResult.insertId),
              monograph_publication_manifestation_id: manifestationId,
            })
            .executeTakeFirstOrThrow();
        }),
      );

      // Finally send the message using SMTP.
      // This is done within the same transaction to guarantee state between db/email provider will match.
      if (messagingConfiguration.SEND_EMAILS) {
        await sendEmail({
          from: messagingConfiguration.ISBN_EMAIL,
          to: recipient,
          subject: finalSubject,
          text: finalBody,
          smtpConfig: messagingConfiguration.SMTP_CONFIG,
        });
      }

      return Number(messageSaveResult.insertId);
    });

    return messageId;
  }

  return {
    createFromTemplate,
    sendMonographMessage,
  };
}
