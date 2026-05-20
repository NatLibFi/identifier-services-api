import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type {
  MonographPublisherReadAdmin,
  MonographPublisherReadAutocomplete,
  MonographPublisherReadGuest,
  MonographPublisherSelect,
} from '../../db/types/monograph/types-monograph-publisher.ts';
import type { UnknownObject } from '../../generic-types.ts';

export function asMonographPublisherAdminRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnRanges: IsbnPublisherRangeSelect[],
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
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asMonographPublisherGuestRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelect[],
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
