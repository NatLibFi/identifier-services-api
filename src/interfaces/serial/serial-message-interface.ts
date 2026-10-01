import HttpStatus from 'http-status';

import { constructSerialMessage } from './serial-message-template-utils.ts';

import { ApiError } from '../../utils/api-error.ts';
import { getApplicationLogger } from '../../utils/logging.ts';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime, validateGetById, validateRowsInserted } from '../shared-interface-utils.ts';
import { sendEmail } from '../email-utils.ts';
import { isProduction } from '../../utils/generic-utils.ts';

import { readSerialPublicationRequest } from './serial-publication-request-interface.ts';

import {
  asSerialMessageAdminRead,
  asSerialMessageSearchResult,
  type SerialMessageInfo,
} from '../../dtl/serial/serial-message-dtl.ts';

import type { MessagingConfiguration } from '../../app.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateSerialMessageFromTemplate,
  ResendSerialMessage,
  SearchSerialMessage,
  SendSerialMessage,
} from '../../validations/serial/serial-message-validation.ts';
import type { LoadedSerialMessageTemplate, SerialMessageSelect } from '../../db/types/serial/types-serial-message.ts';

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createSerialMessageInterface(messagingConfiguration: MessagingConfiguration) {
  async function createFromTemplate(
    createOpt: CreateSerialMessageFromTemplate,
    user: RequestUser,
  ): Promise<LoadedSerialMessageTemplate> {
    const logger = getApplicationLogger();

    // Craft message based on given information now that it has been established all relations are valid
    let result: LoadedSerialMessageTemplate;

    try {
      result = await constructSerialMessage(createOpt, user);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error occurred when attempting to load message template: ${error.message}`);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Could not load message template due to unexpected problem. Please contact system administration.',
      );
    }

    return {
      message_type: result.message_type,
      serial_publisher_id: result.serial_publisher_id,
      serial_publication_request_id: result.serial_publication_request_id,
      recipient: result.recipient,
      subject: result.subject,
      body: result.body,
      lang_code: result.lang_code,
    };
  }

  async function sendSerialMessage(message: SendSerialMessage, user: RequestUser) {
    const { message_type, serial_publisher_id, serial_publication_request_id, recipient, subject, body, lang_code } =
      message;

    // Do not trust user input even though associations should stay the same between loading message template and sending a message
    // Always validate relations before the actual DB operation
    if (serial_publication_request_id) {
      const serialPublicationRequest = await readSerialPublicationRequest(serial_publication_request_id, true);
      if (serialPublicationRequest.serial_publisher_id !== serial_publisher_id) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'Conflict',
          `Serial publication request id ${serial_publication_request_id} does not belong to serial publisher id ${serial_publisher_id}.`,
        );
      }
    }

    // Prefix both subject and body if sending message from other than production environment
    // In case the prefix already is there, do not add it (this may occur when resending messages from other than production instance)
    let finalSubject = subject;
    let finalBody = body;

    if (!isProduction() && !finalSubject.startsWith('TESTI/TEST MESSAGE ')) {
      finalSubject = `TESTI/TEST MESSAGE ${subject}`;
    }

    if (
      !isProduction() &&
      !finalBody.startsWith('Tämä viesti on testijärjestelmästä / This message is from test system.')
    ) {
      finalBody = `Tämä viesti on testijärjestelmästä / This message is from test system.\n\n${body}`;
    }

    // Save to db within transaction
    const db = getKysely();
    const messageId = await db.transaction().execute(async (trx) => {
      // 1. Save message
      const messageSaveResult = await trx
        .insertInto('serial_message')
        .values({
          message_type,
          serial_publisher_id,
          serial_publication_request_id,
          lang_code,
          subject: finalSubject,
          body: finalBody,
          recipient,
          sent: getCurrentTime(),
          sent_by: user.id,
        })
        .executeTakeFirstOrThrow();

      validateRowsInserted(messageSaveResult, 1);

      // 2. Send the message using SMTP.
      // This is done within the same transaction to guarantee state between db/email provider will match.
      if (messagingConfiguration.SEND_EMAILS) {
        await sendEmail({
          from: messagingConfiguration.ISSN_EMAIL,
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

  async function resendSerialMessage(messageId: number, opts: ResendSerialMessage, user: RequestUser) {
    const { recipient } = opts;
    const originalMessage = await readSerialMessage(messageId); // Manages 404 if needed

    // Construct new message from original changing only the recipient
    const newMessage: SendSerialMessage = {
      message_type: originalMessage.message_type,
      serial_publisher_id: originalMessage.serial_publisher_id,
      serial_publication_request_id: originalMessage.serial_publication_request_id,
      recipient,
      body: originalMessage.body,
      subject: originalMessage.subject,
      lang_code: originalMessage.lang_code,
    };

    // Use send function so that all sanity checks are conducted normally
    return sendSerialMessage(newMessage, user);
  }

  async function readSerialMessage(messageId: number) {
    const db = getKysely();
    const messageResult = await db
      .selectFrom('serial_message')
      .leftJoin('serial_publisher', 'serial_publisher.id', 'serial_message.serial_publisher_id')
      .selectAll('serial_message')
      .select(['serial_publisher.official_name as serial_publisher_name'])
      .where('serial_message.id', '=', messageId)
      .execute();

    const validatedMessageResult: SerialMessageInfo = validateGetById(messageResult);
    return asSerialMessageAdminRead(validatedMessageResult);
  }

  async function searchSerialMessages(searchParameters: SearchSerialMessage) {
    const db = getKysely();

    const { search_text, serial_publication_request_id, serial_publisher_id, limit, offset } = searchParameters;
    let query = db.selectFrom('serial_message');

    // Note: validation is expected to enforce usage of only one search method: associated entity id-based search or text-based search
    if (search_text !== undefined) {
      const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

      // Searches from body and recipient
      query = query.where((eb) => {
        return eb.or([
          eb(eb.fn('lower', ['body']), 'like', normalizedSearch),
          eb(eb.fn('lower', ['recipient']), 'like', normalizedSearch),
        ]);
      });
    } else if (serial_publisher_id) {
      query = query.where('serial_publisher_id', '=', serial_publisher_id);
    } else if (serial_publication_request_id) {
      query = query.where('serial_publication_request_id', '=', serial_publication_request_id);
    }

    const countQuery = query.select((eb) => eb.fn.countAll().as('total_doc'));
    query = query.selectAll().orderBy('id', 'desc').limit(limit).offset(offset);

    // @ts-expect-error query builder does not understand typing here
    const result: SerialMessageSelect[] = await query.execute();
    const { total_doc } = await countQuery.executeTakeFirstOrThrow();

    return {
      total_doc,
      results: result.map((message) => asSerialMessageSearchResult(message)),
    };
  }

  return {
    createFromTemplate,
    sendSerialMessage,
    resendSerialMessage,
    readSerialMessage,
    searchSerialMessages,
  };
}
