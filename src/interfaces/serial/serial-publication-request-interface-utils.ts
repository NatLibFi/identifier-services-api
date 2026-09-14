import {
  APPLICATION_USER_UI_PUBLIC,
  SERIAL_PUBLICATION_REQUEST_STATUSES,
  SERIAL_PUBLICATION_STATUS,
} from '../../constants.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';

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
import type { SerialPublicationRequestArchiveInsert } from '../../db/types/serial/types-serial-publication-request-archive.ts';

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
    status: SERIAL_PUBLICATION_REQUEST_STATUSES.NOT_HANDLED,
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
    status: SERIAL_PUBLICATION_REQUEST_STATUSES.NOT_HANDLED,
    publisher_name: httpCreateDoc.form.publisher,
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

export function getArchiveEntry(
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
