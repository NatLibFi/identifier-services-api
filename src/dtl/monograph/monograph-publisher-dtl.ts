import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { IsmnPublisherRangeSelect } from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type {
  MonographPublisherReadAdmin,
  MonographPublisherReadAutocomplete,
  MonographPublisherReadGuest,
  MonographPublisherSelect,
} from '../../db/types/monograph/types-monograph-publisher.ts';
import type { MonographPublisherRequestArchiveSelect } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';
import type { UnknownObject } from '../../generic-types.ts';

export function asMonographPublisherAdminRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnRanges: IsbnPublisherRangeSelect[],
  ismnRanges: IsmnPublisherRangeSelect[],
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
    isbn_publisher_ranges: isbnRanges.map(({ id, publisher_identifier }) => ({ id, publisher_identifier })),
    ismn_publisher_ranges: ismnRanges.map(({ id, publisher_identifier }) => ({ id, publisher_identifier })),
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asMonographPublisherGuestRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelect[],
  ismnRanges: IsmnPublisherRangeSelect[],
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
    isbn_publisher_ranges: isbnPublisherRanges.map(({ publisher_identifier }) => ({ publisher_identifier })),
    ismn_publisher_ranges: ismnRanges.map(({ publisher_identifier }) => ({ publisher_identifier })),
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
