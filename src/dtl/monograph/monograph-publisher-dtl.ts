import type {
  IsbnPublisherRangeSelectExtended,
  IsmnPublisherRangeSelectExtended,
} from '../../interfaces/monograph/monograph-publisher-interface-utils.ts';

import type { IsbnPublisherRangeSelectLite } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { IsmnPublisherRangeSelectLite } from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type { MonographPublisherRequestArchiveSelect } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';
import type {
  MonographPublisherAdminRead,
  MonographPublisherAdminReadSearch,
  MonographPublisherAutocompleteRead,
  MonographPublisherGuestRead,
  MonographPublisherSelect,
} from '../../db/types/monograph/types-monograph-publisher.ts';

export function asMonographPublisherAdminRead(
  monographPublisher: MonographPublisherSelect,
  isbnPublisherRanges: IsbnPublisherRangeSelectExtended[],
  ismnPublisherRanges: IsmnPublisherRangeSelectExtended[],
  joinMsgSent: {
    isbnJoinMsgSent: boolean;
    ismnJoinMsgSent: boolean;
  },
): MonographPublisherAdminRead {
  const {
    id,
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
    created,
    created_by,
    modified,
    modified_by,
  } = monographPublisher;

  return {
    id,
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
    isbn_publisher_ranges: isbnPublisherRanges,
    ismn_publisher_ranges: ismnPublisherRanges,
    isbn_join_msg_sent: joinMsgSent.isbnJoinMsgSent,
    ismn_join_msg_sent: joinMsgSent.ismnJoinMsgSent,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asMonographPublisherAdminReadSearch(
  monographPublisher: MonographPublisherSelect,
  isbnPublisherRanges: IsbnPublisherRangeSelectLite[],
  ismnPublisherRanges: IsmnPublisherRangeSelectLite[],
): MonographPublisherAdminReadSearch {
  const {
    id,
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
    created,
    created_by,
    modified,
    modified_by,
  } = monographPublisher;

  return {
    id,
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
    isbn_publisher_ranges: isbnPublisherRanges,
    ismn_publisher_ranges: ismnPublisherRanges,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asMonographPublisherGuestRead(
  monographPublisher: MonographPublisherSelect,
  isbnPublisherRanges: IsbnPublisherRangeSelectLite[],
  ismnPublisherRanges: IsmnPublisherRangeSelectLite[],
): MonographPublisherGuestRead {
  const { id, official_name, other_names, previous_names, address, zip, city, phone, www, has_quitted } =
    monographPublisher;

  return {
    id,
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    www,
    has_quitted,
    isbn_publisher_ranges: isbnPublisherRanges.map(({ publisher_identifier }) => ({ publisher_identifier })),
    ismn_publisher_ranges: ismnPublisherRanges.map(({ publisher_identifier }) => ({ publisher_identifier })),
  };
}

export function asMonographPublisherAutocompleteRead(
  monographPublisher: MonographPublisherSelect,
): MonographPublisherAutocompleteRead {
  const { id, official_name, other_names, previous_names } = monographPublisher;

  return {
    id,
    official_name,
    other_names,
    previous_names,
  };
}

export function asMonographPublisherArchiveEntry(
  monographPublisherArchiveEntry: MonographPublisherRequestArchiveSelect,
): MonographPublisherRequestArchiveSelect {
  const {
    id,
    monograph_publisher_id,
    monograph_publisher_request_id,
    official_name,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    frequency_current,
    frequency_next,
    other_names,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    created,
    created_by,
  } = monographPublisherArchiveEntry;

  return {
    id,
    monograph_publisher_id,
    monograph_publisher_request_id,
    official_name,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    frequency_current,
    frequency_next,
    other_names,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    created,
    created_by,
  };
}
