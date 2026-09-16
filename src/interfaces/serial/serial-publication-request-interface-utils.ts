import HttpStatus from 'http-status';

import {
  APPLICATION_USER_UI_PUBLIC,
  SERIAL_PUBLICATION_REQUEST_STATUS,
  SERIAL_PUBLICATION_STATUS,
} from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getCurrentTime, validateRowsUpdatedExact } from '../shared-interface-utils.ts';

import { readSerialPublication } from './serial-publication-interface.ts';
import { readSerialPublisher } from './serial-publisher-interface.ts';
import { readSerialPublicationRequest } from './serial-publication-request-interface.ts';

import { asSerialPublicationRequestArchiveAdminRead } from '../../dtl/serial/serial-publication-request-archive-dtl.ts';
import { asSerialMessageAdminRead } from '../../dtl/serial/serial-message-dtl.ts';

import type { SerialPublicationRequestInsert } from '../../db/types/serial/types-serial-publication-request.ts';
import type {
  SerialPublicationInsert,
  SerialPublicationPreviousSeries,
} from '../../db/types/serial/types-serial-publication.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateSerialPublicationRequestHttp,
  CreateSerialPublicationRequestV1Http,
  CreateSerialPublicationRequestV2Http,
} from '../../validations/serial/serial-publication-request-validation.ts';
import type {
  SerialPublicationRequestArchiveInsert,
  SerialPublicationRequestArchiveSelect,
} from '../../db/types/serial/types-serial-publication-request-archive.ts';
import type { SerialPublicationAdminRead } from '../../dtl/serial/serial-publication-dtl.ts';
import type { SerialMessageSelect } from '../../db/types/serial/types-serial-message.ts';
import type { SerialPublicationRequestAdminRead } from '../../dtl/serial/serial-publication-request-dtl.ts';

type SerialPublicationInsertWithoutRequest = Omit<SerialPublicationInsert, 'serial_publication_request_id'>;

export interface SerialPublicationRequestDbCreate {
  request: SerialPublicationRequestInsert;
  publications: SerialPublicationInsertWithoutRequest[];
}

interface OldAssociatedSeries {
  title: string[];
  issn: string[];
  lastIssue?: string[];
}

export function transformAssociatedSeries(
  oldSeriesInfo?: OldAssociatedSeries | null,
): SerialPublicationPreviousSeries[] {
  if (!oldSeriesInfo) {
    return [];
  }

  const { title, issn, lastIssue } = oldSeriesInfo;

  const titlesLength = title.length;
  const issnLength = issn.length;
  const lastIssuesLength = lastIssue?.length || 0;

  // Expect arrays are in sync based on index
  const maxLength = [titlesLength, issnLength, lastIssuesLength].reduce((p, n) => (p > n ? p : n), 0);
  const result: SerialPublicationPreviousSeries[] = [];

  // Expect arrays to be in sync with one another
  for (let i = 0; i < maxLength; i++) {
    const localTitle = title?.[i] || null;
    const localIssn = issn?.[i] || null;
    const localLastIssue = lastIssue?.[i] || null;

    if (!title && !issn) {
      continue;
    }

    result.push({ title: localTitle, issn: localIssn, last_issue: localLastIssue });
  }

  return result;
}

export function getDbSerialPublicationRequestEntries(
  serialPublicationRequestCreateDoc: CreateSerialPublicationRequestHttp,
  user: RequestUser,
) {
  const { version } = serialPublicationRequestCreateDoc;

  if (version === 1) {
    return getSerialPublicationRequestDbV1(serialPublicationRequestCreateDoc, user);
  }

  if (version === 2) {
    return getSerialPublicationRequestDbV2(serialPublicationRequestCreateDoc, user);
  }

  throw new Error('Unsupported version for Serial Publication Request');
}

export function getSerialPublicationRequestDbV1(
  httpCreateDoc: CreateSerialPublicationRequestV1Http,
  user?: RequestUser,
): SerialPublicationRequestDbCreate {
  const request: SerialPublicationRequestInsert = {
    serial_publisher_id: null,
    status: SERIAL_PUBLICATION_REQUEST_STATUS.NOT_HANDLED,
    publisher_name: httpCreateDoc.form.publisher,
    contact_person: httpCreateDoc.form.contactPerson,
    email: httpCreateDoc.form.email,
    phone: httpCreateDoc.form.phone,
    address: httpCreateDoc.form.address,
    zip: httpCreateDoc.form.zip,
    city: httpCreateDoc.form.city,
    lang_code: httpCreateDoc.form.langCode,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };

  const publications: SerialPublicationInsertWithoutRequest[] = httpCreateDoc.publications.map((p) => {
    const previousValue = transformAssociatedSeries(p.previous);
    const mainSeriesValue = transformAssociatedSeries(p.mainSeries).map(({ title, issn }) => ({ title, issn }));
    const subseriesValue = transformAssociatedSeries(p.subseries).map(({ title, issn }) => ({ title, issn }));
    const anotherMediumValue = transformAssociatedSeries(p.anotherMedium).map(({ title, issn }) => ({ title, issn }));

    return {
      serial_publisher_id: null,
      title: p.title,
      subtitle: p.subtitle,
      place_of_publication: p.placeOfPublication,
      printer: p.printer,
      issued_from_year: p.issuedFromYear,
      issued_from_number: p.issuedFromNumber,
      frequency: p.frequency,
      frequency_other: p.frequencyOther,
      language: p.language,
      publication_type: p.publicationType,
      publication_type_other: p.publicationTypeOther,
      medium: p.medium,
      medium_other: p.mediumOther,
      url: p.url,
      previous: JSON.stringify(previousValue),
      main_series: JSON.stringify(mainSeriesValue),
      subseries: JSON.stringify(subseriesValue),
      another_medium: JSON.stringify(anotherMediumValue),
      additional_info: p.additionalInfo,
      status: SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED,
      created: getCurrentTime(),
      created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
      modified: getCurrentTime(),
      modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    };
  });

  return { request, publications };
}

export function getSerialPublicationRequestDbV2(
  httpCreateDoc: CreateSerialPublicationRequestV2Http,
  user?: RequestUser,
): SerialPublicationRequestDbCreate {
  const request: SerialPublicationRequestInsert = {
    serial_publisher_id: null,
    status: SERIAL_PUBLICATION_REQUEST_STATUS.NOT_HANDLED,
    publisher_name: httpCreateDoc.form.publisher_name,
    contact_person: httpCreateDoc.form.contact_person,
    email: httpCreateDoc.form.email,
    phone: httpCreateDoc.form.phone,
    address: httpCreateDoc.form.address,
    zip: httpCreateDoc.form.zip,
    city: httpCreateDoc.form.city,
    lang_code: httpCreateDoc.form.lang_code,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };

  const publications: SerialPublicationInsertWithoutRequest[] = httpCreateDoc.publications.map((p) => ({
    serial_publisher_id: null,
    title: p.title,
    subtitle: p.subtitle,
    place_of_publication: p.place_of_publication,
    printer: p.printer,
    issued_from_year: p.issued_from_year,
    issued_from_number: p.issued_from_number,
    frequency: p.frequency,
    frequency_other: p.frequency_other,
    language: p.language,
    publication_type: p.publication_type,
    publication_type_other: p.publication_type_other,
    medium: p.medium,
    medium_other: p.medium_other,
    url: p.url,
    previous: JSON.stringify(p.previous || []),
    main_series: JSON.stringify(p.main_series || []),
    subseries: JSON.stringify(p.subseries || []),
    another_medium: JSON.stringify(p.another_medium || []),
    additional_info: p.additional_info,
    status: SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  }));

  return { request, publications };
}

export function getNewSerialPublicationRequestArchiveDbEntry(
  r: SerialPublicationRequestInsert,
  requestId: number,
): SerialPublicationRequestArchiveInsert {
  return {
    serial_publication_request_id: requestId,
    publisher_name: r.publisher_name,
    contact_person: r.contact_person,
    email: r.email,
    phone: r.phone,
    address: r.address,
    zip: r.zip,
    city: r.city,
    lang_code: r.lang_code,
    created: getCurrentTime(),
    created_by: r.created_by,
  };
}

export async function getSerialRequestPublications(
  serialPublicationRequestId: number,
): Promise<SerialPublicationAdminRead[]> {
  const db = getKysely();
  const publicationIds = await db
    .selectFrom('serial_publication')
    .select('id')
    .where('serial_publication_request_id', '=', serialPublicationRequestId)
    .execute();

  return await Promise.all(
    publicationIds.map(async ({ id: publicationId }) => await readSerialPublication(publicationId)),
  );
}

export async function getSerialPublicationRequestArchiveEntry(
  serialPublicationRequestId: number,
): Promise<SerialPublicationRequestArchiveSelect | null> {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('serial_publication_request_archive')
    .selectAll()
    .where('serial_publication_request_id', '=', serialPublicationRequestId)
    .execute();

  const archiveEntry = dbResult[0];

  if (dbResult.length === 0 || !archiveEntry) {
    return null;
  }

  if (dbResult.length > 1) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Serial publication request id ${serialPublicationRequestId} is associated with ${dbResult.length} archive entries. This should not happen. Please notify system administrators.`,
    );
  }

  return asSerialPublicationRequestArchiveAdminRead(archiveEntry);
}

export async function getSerialPublicationRequestMessages(
  serialPublicationRequestId: number,
): Promise<SerialMessageSelect[]> {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('serial_message')
    .selectAll()
    .where('serial_publication_request_id', '=', serialPublicationRequestId)
    .execute();

  return dbResult.map(asSerialMessageAdminRead);
}

export async function changeSerialPublicationRequestPublisher(
  r: SerialPublicationRequestAdminRead,
  newPublisherId: number | null,
  user: RequestUser,
) {
  if (newPublisherId !== null) {
    // Verify publisher exists in db by utilizing serial publisher interface
    await readSerialPublisher(newPublisherId);
  }

  // Disallow changing publisher after a message has been sent
  const associatedMessages = await getSerialPublicationRequestMessages(r.id);

  if (associatedMessages.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${r.id} is associated with ${associatedMessages.length} messages. Publisher can no longer be edited for the request.`,
    );
  }

  // Disallow changing publisher for completed request
  if (r.status === SERIAL_PUBLICATION_REQUEST_STATUS.COMPLETED) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${r.id} is already in completed state. Publisher can no longer be edited for the request.`,
    );
  }

  // Change publisher for the form and all associated publications within transaction
  const db = getKysely();

  await db.transaction().execute(async (trx) => {
    // Update associated publications
    const publicationUpdateResult = await trx
      .updateTable('serial_publication')
      .set({ serial_publisher_id: newPublisherId, modified: getCurrentTime(), modified_by: user.id })
      .where('serial_publication_request_id', '=', r.id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(publicationUpdateResult, r.publications.length);

    // Update request
    const requestUpdateResult = await trx
      .updateTable('serial_publication_request')
      .set({ serial_publisher_id: newPublisherId, modified: getCurrentTime(), modified_by: user.id })
      .where('id', '=', r.id)
      .executeTakeFirstOrThrow();
    validateRowsUpdatedExact(requestUpdateResult, 1);
  });

  // Return using lite read interface similar to other updates
  return readSerialPublicationRequest(r.id, true);
}

export async function changeSerialPublicationRequestStatus(
  r: SerialPublicationRequestAdminRead,
  newStatus: string,
  user: RequestUser,
) {
  // Disallow update operation on no status change
  const statusNotChanged = newStatus === r.status;
  if (statusNotChanged) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${r.id} status is already ${newStatus} - refusing to re-save.`,
    );
  }

  // Block rejecting request if any associated publications has ISSN identifier assigned
  const accepting = newStatus === SERIAL_PUBLICATION_REQUEST_STATUS.COMPLETED;
  const rejecting = newStatus === SERIAL_PUBLICATION_REQUEST_STATUS.REJECTED;

  // Verify no ISSN association exists and status is in sync
  const publicationsWithIssn = r.publications
    .filter((p) => Boolean(p.issn_identifier) || p.status !== SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED)
    .map((p) => p.id);

  if (rejecting && publicationsWithIssn.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${r.id} publication ids ${publicationsWithIssn.join(', ')} have ISSN assigned already and thus request cannot be rejected.`,
    );
  }

  // Disallow completing request when there are publications without ISSN
  const publicationsWithoutIssn = r.publications
    .filter((p) => !p.issn_identifier || p.status === SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED)
    .map((p) => p.id);

  if (accepting && publicationsWithoutIssn.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${r.id} publication ids ${publicationsWithoutIssn.join(', ')} do not have ISSN assigned and thus request cannot be completed.`,
    );
  }

  const notMessagedStatuses = [
    SERIAL_PUBLICATION_REQUEST_STATUS.NOT_NOTIFIED,
    SERIAL_PUBLICATION_REQUEST_STATUS.NOT_HANDLED,
  ];

  if (notMessagedStatuses.includes(newStatus)) {
    const associatedMessages = await getSerialPublicationRequestMessages(r.id);
    if (associatedMessages.length > 0) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Serial publication request id ${r.id} has ${associatedMessages.length} associated messages and thus request cannot be reset to NOT_NOTIFIED or NOT_HANDLED.`,
      );
    }
  }

  const db = getKysely();
  await db.transaction().execute(async (trx) => {
    // Note: since precondition of having NO_ISSN_GRANTED status has been verified for all associated publications,
    // status change for them is not needed here. Update here is leftover and serves as a sanity check.
    if (rejecting) {
      const publicationDbUpdate = {
        status: SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED,
        modified: getCurrentTime(),
        modified_by: user.id,
      };

      const publicationUpdateResult = await trx
        .updateTable('serial_publication')
        .set(publicationDbUpdate)
        .where('serial_publication_request_id', '=', r.id)
        .where('status', '!=', SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED)
        .executeTakeFirstOrThrow();

      // Sanity check: no rows should be updateable
      validateRowsUpdatedExact(publicationUpdateResult, 0);
    }

    const requestDbUpdate = { status: newStatus, modified: getCurrentTime(), modified_by: user.id };
    const requestUpdateResult = await trx
      .updateTable('serial_publication_request')
      .set(requestDbUpdate)
      .where('id', '=', r.id)
      .executeTakeFirstOrThrow();
    validateRowsUpdatedExact(requestUpdateResult, 1);
  });

  // Return using lite read interface similar to other updates
  return readSerialPublicationRequest(r.id, true);
}
