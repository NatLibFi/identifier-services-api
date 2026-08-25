import { getCurrentTime } from '../shared-interface-utils.ts';
import { APPLICATION_USER_UI_PUBLIC, MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

import type { Insertable } from 'kysely';
import type { MonographPublisherRequestInsert } from '../../db/types/monograph/types-monograph-publisher-request.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateMonographPublisherRequestV1Http,
  CreateMonographPublisherRequestV2Http,
} from '../../validations/monograph/monograph-publisher-request-validation.ts';
import type { MonographPublisherRequestArchiveInsert } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';
import { getKysely } from '../../db/database.ts';

export function getDbPublisherRequestEntry(
  createDoc: CreateMonographPublisherRequestV1Http | CreateMonographPublisherRequestV2Http,
  user: RequestUser,
): MonographPublisherRequestInsert {
  if (createDoc.version === 1) {
    return getDbPublisherRequestEntryV1(createDoc, user);
  }

  return getDbPublisherRequestEntryV2(createDoc, user);
}

export function getDbPublisherRequestArchiveEntry(
  publisherRequest: MonographPublisherRequestInsert,
  monographPublisherRequestId: number,
): MonographPublisherRequestArchiveInsert {
  return {
    monograph_publisher_id: null,
    monograph_publisher_request_id: monographPublisherRequestId,
    official_name: publisherRequest.official_name,
    other_names: publisherRequest.other_names,
    contact_persons: publisherRequest.contact_persons,
    address: publisherRequest.address,
    zip: publisherRequest.zip,
    city: publisherRequest.city,
    phone: publisherRequest.phone,
    email: publisherRequest.email,
    lang_code: publisherRequest.lang_code,
    www: publisherRequest.www,
    frequency_current: publisherRequest.frequency_current,
    frequency_next: publisherRequest.frequency_next,
    affiliate_of: publisherRequest.affiliate_of,
    affiliates: publisherRequest.affiliates,
    distributor_of: publisherRequest.distributor_of,
    distributors: publisherRequest.distributors,
    classifications: publisherRequest.classifications,
    classification_other: publisherRequest.classification_other,
    created: getCurrentTime(),
    created_by: publisherRequest.created_by,
  };
}

export function getDbPublisherRequestEntryV1(
  monographPublisherRequestCreateDocV1: CreateMonographPublisherRequestV1Http,
  user: RequestUser,
): Insertable<MonographPublisherRequestInsert> {
  const {
    officialName,
    otherNames,
    contactPerson,
    address,
    zip,
    city,
    phone,
    email,
    www,
    langCode,
    frequencyCurrent,
    frequencyNext,
    affiliateOf,
    affiliates,
    distributorOf,
    distributors,
    classification,
    classificationOther,
  } = monographPublisherRequestCreateDocV1;

  const processedOtherNames = otherNames && otherNames.length > 0 ? otherNames.split(',') : [];
  const contactPersons = JSON.stringify([{ name: contactPerson, email: null }]);

  return {
    official_name: officialName,
    other_names: JSON.stringify(processedOtherNames),
    contact_persons: contactPersons,
    address,
    zip,
    city,
    phone,
    email,
    lang_code: langCode,
    www: www || null,
    frequency_current: frequencyCurrent || null,
    frequency_next: frequencyNext || null,
    affiliate_of: affiliateOf || null,
    affiliates: affiliates || null,
    distributor_of: distributorOf || null,
    distributors: distributors || null,
    classifications: classification ? JSON.stringify(classification) : JSON.stringify([]),
    classification_other: classificationOther || null,
    additional_info: null,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export function getDbPublisherRequestEntryV2(
  monographPublisherRequestCreateDocV1: CreateMonographPublisherRequestV2Http,
  user: RequestUser,
): Insertable<MonographPublisherRequestInsert> {
  const {
    official_name,
    other_names,
    contact_persons,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
  } = monographPublisherRequestCreateDocV1;

  return {
    official_name,
    other_names: JSON.stringify(other_names),
    contact_persons: JSON.stringify(contact_persons),
    address,
    zip,
    city,
    phone,
    email,
    lang_code,
    www: www || null,
    frequency_current: frequency_current || null,
    frequency_next: frequency_next || null,
    affiliate_of: affiliate_of || null,
    affiliates: affiliates || null,
    distributor_of: distributor_of || null,
    distributors: distributors || null,
    classifications: classifications ? JSON.stringify(classifications) : JSON.stringify([]),
    classification_other: classification_other || null,
    additional_info: null,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export async function getJoinMsgSent(publisherId: number) {
  const db = await getKysely();
  const joinConfirmationMessageTypes = [
    MONOGRAPH_MESSAGE_TYPES.ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
    MONOGRAPH_MESSAGE_TYPES.ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION,
  ];

  const result = await db
    .selectFrom('monograph_message')
    .select('id')
    .where('message_type', 'in', joinConfirmationMessageTypes)
    .where('monograph_publisher_id', '=', publisherId)
    .limit(1)
    .executeTakeFirst();

  return result !== undefined;
}
