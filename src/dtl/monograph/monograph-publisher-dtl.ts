import type {
  MonographPublisherReadAdmin,
  MonographPublisherReadAdminSearch,
  MonographPublisherReadAutocomplete,
  MonographPublisherReadGuest,
  MonographPublisherSelect,
} from '../../db/types/monograph/types-monograph-publisher.ts';
import type { MonographPublisherRequestArchiveSelect } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';
import type { IsbnPublisherRangeSelectLite } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { IsmnPublisherRangeSelectLite } from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type {
  IsbnPublisherRangeSelectExtended,
  IsmnPublisherRangeSelectExtended,
} from '../../interfaces/monograph/monograph-publisher-interface-utils.ts';
import type { UnknownObject } from '../../generic-types.ts';

export function asMonographPublisherAdminRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelectExtended[],
  ismnPublisherRanges: IsmnPublisherRangeSelectExtended[],
): MonographPublisherReadAdmin {
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

export function asMonographPublisherAdminSearchRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelectLite[],
  ismnPublisherRanges: IsmnPublisherRangeSelectLite[],
): MonographPublisherReadAdminSearch {
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
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelectLite[],
  ismnPublisherRanges: IsmnPublisherRangeSelectLite[],
): MonographPublisherReadGuest {
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
    isbn_publisher_ranges: isbnPublisherRanges.map(({ publisher_identifier }) => ({ publisher_identifier })), // Note: no detailed usage info is provided
    ismn_publisher_ranges: ismnPublisherRanges.map(({ publisher_identifier }) => ({ publisher_identifier })), // Note: no detailed usage info is provided
  };
}

export function asMonographPublisherAutocompleteRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
): MonographPublisherReadAutocomplete {
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
