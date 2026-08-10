import type {
  MonographPublisherReadAdmin,
  MonographPublisherReadAutocomplete,
  MonographPublisherReadGuest,
  MonographPublisherSelect,
} from '../../db/types/monograph/types-monograph-publisher.ts';
import type { MonographPublisherRequestArchiveSelect } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';
import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { IsmnPublisherRangeSelect } from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type {
  IsbnPublisherRangeSelectExtended,
  IsmnPublisherRangeSelectExtended,
} from '../../interfaces/monograph/monograph-publisher-interface-utils.ts';
import type { UnknownObject } from '../../generic-types.ts';
import {
  ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
} from '../../constants.ts';

export function asMonographPublisherAdminRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelect[] | IsbnPublisherRangeSelectExtended[],
  ismnPublisherRanges: IsmnPublisherRangeSelect[] | IsmnPublisherRangeSelectExtended[],
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

  const isbnPublisherRangeInformation = isbnPublisherRanges.map((isbnPublisherRange) => {
    const isbnPublisherRangeBase: {
      id: number;
      publisher_identifier: string;
      created?: Date;
      identifier_total?: number | null;
      identifier_used?: number | null;
      identifier_free?: number | null;
    } = {
      id: isbnPublisherRange.id,
      publisher_identifier: isbnPublisherRange.publisher_identifier,
    };
    if ('identifier_total' in isbnPublisherRange) {
      // Quick and dirty method for including created metadata only for relevant admin reads
      isbnPublisherRangeBase.created = isbnPublisherRange.created;
      isbnPublisherRangeBase.identifier_total = isbnPublisherRange.identifier_total;
    }

    // Note: identifier free/used are made available only for category 5 ISBN publisher ranges
    // This is due to category 1-4 ISBN publisher ranges being controlled by publishers outside of this system
    // We have no way of having up-to-date information regarding usage of these identifiers currently
    const fillIdentifierUsage =
      isbnPublisherRange.publisher_identifier.length === ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH[5];

    if ('identifier_used' in isbnPublisherRange) {
      isbnPublisherRangeBase.identifier_used = fillIdentifierUsage ? isbnPublisherRange.identifier_used : null;
    }

    if ('identifier_free' in isbnPublisherRange) {
      isbnPublisherRangeBase.identifier_free = fillIdentifierUsage ? isbnPublisherRange.identifier_free : null;
    }

    return isbnPublisherRangeBase;
  });

  const ismnPublisherRangeInformation = ismnPublisherRanges.map((ismnPublisherRange) => {
    const ismnPublisherRangeBase: {
      id: number;
      publisher_identifier: string;
      created?: Date;
      identifier_total?: number | null;
      identifier_used?: number | null;
      identifier_free?: number | null;
    } = {
      id: ismnPublisherRange.id,
      publisher_identifier: ismnPublisherRange.publisher_identifier,
    };

    if ('identifier_total' in ismnPublisherRange) {
      // Quick and dirty method for including created metadata only for relevant admin reads
      ismnPublisherRangeBase.created = ismnPublisherRange.created;
      ismnPublisherRangeBase.identifier_total = ismnPublisherRange.identifier_total;
    }

    // Note: identifier totals are made available only for category 7 ISMN publisher ranges
    // This is due to category 3-6 ISMN publisher ranges being controlled by publishers outside of this system
    // We have no way of having up-to-date information regarding usage of these identifiers currently
    const fillIdentifierUsage =
      ismnPublisherRange.publisher_identifier.length === ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH[7];

    if ('identifier_used' in ismnPublisherRange) {
      ismnPublisherRangeBase.identifier_used = fillIdentifierUsage ? ismnPublisherRange.identifier_used : null;
    }

    if ('identifier_free' in ismnPublisherRange) {
      ismnPublisherRangeBase.identifier_free = fillIdentifierUsage ? ismnPublisherRange.identifier_free : null;
    }

    return ismnPublisherRangeBase;
  });

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
    isbn_publisher_ranges: isbnPublisherRangeInformation,
    ismn_publisher_ranges: ismnPublisherRangeInformation,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asMonographPublisherGuestRead(
  monographPublisher: MonographPublisherSelect | UnknownObject,
  isbnPublisherRanges: IsbnPublisherRangeSelect[],
  ismnPublisherRanges: IsmnPublisherRangeSelect[],
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
