import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import { readSerialPublicationRequest } from './serial-publication-request-interface.ts';
import { readSerialPublisher } from './serial-publisher-interface.ts';
import { readSerialPublication } from './serial-publication-interface.ts';

import { SERIAL_MESSAGE_TYPES, SERIAL_PUBLICATION_MEDIUM } from '../../constants.ts';
import { getMessageTemplate } from '../message-template-interface.ts';

import type { SerialPublicationRequestAdminRead } from '../../dtl/serial/serial-publication-request-dtl.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreateSerialMessageFromTemplate } from '../../validations/serial/serial-message-validation.ts';
import type { SerialPublisherSelect } from '../../db/types/serial/types-serial-publisher.ts';
import type { LoadedSerialMessageTemplate } from '../../db/types/serial/types-serial-message.ts';
import type { SerialPublicationAdminRead } from '../../dtl/serial/serial-publication-dtl.ts';

async function constructIssnAssignedMessage(
  serialPublisher: SerialPublisherSelect,
  serialPublicationRequestId: number,
  user: RequestUser,
): Promise<LoadedSerialMessageTemplate> {
  // @ts-expect-error dynamic return value from interface
  const serialPublicationRequest: SerialPublicationRequestAdminRead =
    await readSerialPublicationRequest(serialPublicationRequestId);

  // Verify relations
  if (serialPublicationRequest.serial_publisher_id !== serialPublisher.id) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${serialPublicationRequest.id} does not belong to serial publisher id ${serialPublisher.id}.`,
    );
  }

  // Prioritize request information
  const publisherContactPerson = serialPublisher.contact_persons.length > 0 ? serialPublisher.contact_persons[0] : null;
  const contactPersonName = serialPublicationRequest.contact_person || publisherContactPerson?.name;
  const recipient = serialPublicationRequest.email || publisherContactPerson?.email;
  const langCode = serialPublicationRequest.lang_code;

  // Validate contact person name and recipient are defined
  if (!contactPersonName) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${serialPublicationRequest.id} and serial publisher id ${serialPublisher.id} do not provide contact person name which is required.`,
    );
  }

  if (!recipient) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${serialPublicationRequest.id} and serial publisher id ${serialPublisher.id} do not provide contact person email address which is required.`,
    );
  }

  // Find template
  const messageTemplate = await getMessageTemplate({
    message_type: SERIAL_MESSAGE_TYPES.ISSN_ASSIGNMENT,
    lang_code: langCode,
  });

  // Construct message based on template and related entity information
  let body = messageTemplate.body;
  let subject = messageTemplate.subject;

  // Title of first publication is observed as title
  const title: string = serialPublicationRequest.publications[0]?.title || '';
  subject = subject.replace('#TITLE#', title);
  body = body.replace('#TITLE#', title);

  // Replace publication information
  const publicationInfo = serialPublicationRequest.publications
    .filter((p) => Boolean(p.issn_identifier))
    .map((p) => {
      const issn = p.issn_identifier?.identifier;

      // Sanity check: should not ever happen due to prior filtering
      // Also helps in typing
      if (!issn) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'Conflict',
          `Serial publication request id ${serialPublicationRequest.id} contains publication id ${p.id} which does not have identifier. It cannot be added to message.`,
        );
      }

      return `${p.title} ISSN ${issn} (${translateSerialMediumType(p.medium, langCode)})`;
    })
    .join('\n');

  const formattedPublicationInfo = `\n${publicationInfo}\n`;
  body = body.replace('#PUBLICATIONS#', formattedPublicationInfo);
  body = body.replace('#CONTACT_PERSON#', contactPersonName);

  // Add generics
  body = body.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
  body = body.replace('#USER#', user.name);
  body = body.replace('#EMAIL#', recipient);
  body = body.replace('#PUBLISHER#', serialPublisher.official_name);
  body = body.replace('#ADDRESS#', `${serialPublisher.address}\n${serialPublisher.zip} ${serialPublisher.city}`);

  return {
    serial_publisher_id: serialPublisher.id,
    serial_publication_request_id: serialPublicationRequest.id,
    message_type: SERIAL_MESSAGE_TYPES.ISSN_ASSIGNMENT,
    lang_code: langCode,
    recipient,
    subject,
    body,
  };
}

async function constructPublisherSummaryMessage(
  serialPublisher: SerialPublisherSelect,
  user: RequestUser,
): Promise<LoadedSerialMessageTemplate> {
  const db = getKysely();
  const serialPublicationIdResult = await db
    .selectFrom('serial_publication')
    .select('id')
    .where('serial_publisher_id', '=', serialPublisher.id)
    .execute();

  if (serialPublicationIdResult.length < 1) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Serial publisher id ${serialPublisher.id} does not have any publications.`,
    );
  }

  const serialPublications: SerialPublicationAdminRead[] = await Promise.all(
    serialPublicationIdResult.map(async (result) => await readSerialPublication(result.id)),
  );
  const serialPublicationsWithIssn = serialPublications.filter((p) => Boolean(p.issn_identifier));

  if (serialPublicationsWithIssn.length < 1) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Serial publisher id ${serialPublisher.id} does not have any publications with ISSN identifier.`,
    );
  }

  const publisherContactPerson = serialPublisher.contact_persons.length > 0 ? serialPublisher.contact_persons[0] : null;
  const contactPersonName = publisherContactPerson?.name;
  const recipient = publisherContactPerson?.email;
  const langCode = serialPublisher.lang_code;

  // Validate contact person name and recipient are defined
  if (!contactPersonName) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publisher id ${serialPublisher.id} does not provide contact person name which is required.`,
    );
  }

  if (!recipient) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publisher id ${serialPublisher.id} does not provide contact person email address which is required.`,
    );
  }

  // Find template
  const messageTemplate = await getMessageTemplate({
    message_type: SERIAL_MESSAGE_TYPES.ISSN_LIST_DELIVERY,
    lang_code: langCode,
  });

  // Construct message based on template and related entity information
  let body = messageTemplate.body;
  let subject = messageTemplate.subject;

  // Title of first publication is observed as title
  const title: string = serialPublicationsWithIssn[0]?.title || '';
  subject = subject.replace('#TITLE#', title);
  body = body.replace('#TITLE#', title);

  // Replace publication information
  const publicationInfo = serialPublicationsWithIssn
    .map((p) => {
      const issn = p.issn_identifier?.identifier;

      // Sanity check: should not ever happen due to prior filtering
      // Also helps in typing
      if (!issn) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'Conflict',
          `Publication id ${p.id} should have had ISSN identifier but now does not. It cannot be added to message.`,
        );
      }

      return `${p.title} ISSN ${issn} (${translateSerialMediumType(p.medium, langCode)})`;
    })
    .join('\n');

  const formattedPublicationInfo = `\n${publicationInfo}\n`;
  body = body.replace('#PUBLICATIONS#', formattedPublicationInfo);
  body = body.replace('#CONTACT_PERSON#', contactPersonName);

  // Add generics
  body = body.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
  body = body.replace('#USER#', user.name);
  body = body.replace('#EMAIL#', recipient);
  body = body.replace('#PUBLISHER#', serialPublisher.official_name);
  body = body.replace('#ADDRESS#', `${serialPublisher.address}\n${serialPublisher.zip} ${serialPublisher.city}`);

  return {
    serial_publisher_id: serialPublisher.id,
    serial_publication_request_id: null,
    message_type: SERIAL_MESSAGE_TYPES.ISSN_LIST_DELIVERY,
    lang_code: langCode,
    recipient,
    subject,
    body,
  };
}

export function translateSerialMediumType(serialMediumType: string, langCode: string): string {
  const translations = {
    'fi-FI': {
      [SERIAL_PUBLICATION_MEDIUM.PRINTED]: 'painettu',
      [SERIAL_PUBLICATION_MEDIUM.ONLINE]: 'verkkojulkaisu',
      [SERIAL_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [SERIAL_PUBLICATION_MEDIUM.OTHER]: 'muu',
    },
    'sv-SE': {
      [SERIAL_PUBLICATION_MEDIUM.PRINTED]: 'print',
      [SERIAL_PUBLICATION_MEDIUM.ONLINE]: 'online',
      [SERIAL_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [SERIAL_PUBLICATION_MEDIUM.OTHER]: 'annan',
    },
    'en-GB': {
      [SERIAL_PUBLICATION_MEDIUM.PRINTED]: 'printed',
      [SERIAL_PUBLICATION_MEDIUM.ONLINE]: 'online',
      [SERIAL_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [SERIAL_PUBLICATION_MEDIUM.OTHER]: 'other',
    },
  };

  if (!Object.keys(translations).includes(langCode)) {
    throw new Error('Language code for translating email type could not be found');
  }

  // @ts-expect-error translation tables are missing typing
  if (!Object.keys(translations[langCode]).includes(serialMediumType)) {
    throw new Error('Identifier type translating email type could not be found');
  }

  // @ts-expect-error translation tables are missing typing
  return translations[langCode][serialMediumType];
}

export async function constructSerialMessage(
  constructSerialMessageParams: CreateSerialMessageFromTemplate,
  user: RequestUser,
): Promise<LoadedSerialMessageTemplate> {
  const { message_type, serial_publication_request_id, serial_publisher_id } = constructSerialMessageParams;

  const serialPublisher = await readSerialPublisher(serial_publisher_id);

  switch (message_type) {
    case SERIAL_MESSAGE_TYPES.ISSN_ASSIGNMENT:
      if (!serial_publication_request_id) {
        throw new ApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Validation error',
          `Required parameter serial_publication_request_id was not defined.`,
        );
      }

      return constructIssnAssignedMessage(serialPublisher, serial_publication_request_id, user);
    case SERIAL_MESSAGE_TYPES.ISSN_LIST_DELIVERY:
      return constructPublisherSummaryMessage(serialPublisher, user);
    default:
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        `Unsupported message type: ${message_type}.`,
      );
  }
}
