import type { MonographPublisherRequestSelect } from '../../db/types/monograph/types-monograph-publisher-request.ts';
import type { MonographPublisherContactPerson } from '../../db/types/monograph/types-monograph-publisher.ts';

export interface MonographPublisherRequestReadAdmin {
  id: number;
  official_name: string;
  other_names: string[];
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  www: string | null;
  lang_code: string;
  contact_persons: MonographPublisherContactPerson[];
  additional_info: string | null;
  frequency_current: string | null;
  frequency_next: string | null;
  affiliate_of: string | null;
  affiliates: string | null;
  distributor_of: string | null;
  distributors: string | null;
  classifications: string[];
  classification_other: string | null;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export function asMonographPublisherRequestAdminRead(
  monographPublisherRequest: MonographPublisherRequestSelect,
): MonographPublisherRequestReadAdmin {
  const {
    id,
    official_name,
    other_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    created,
    created_by,
    modified,
    modified_by,
  } = monographPublisherRequest;

  return {
    id,
    official_name,
    other_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    created,
    created_by,
    modified,
    modified_by,
  };
}
