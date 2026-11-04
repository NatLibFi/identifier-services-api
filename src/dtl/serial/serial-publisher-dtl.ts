import type { SerialPublisherSelect } from '../../db/types/serial/types-serial-publisher.ts';

export function asSerialPublisherAdminRead(serialPublisher: SerialPublisherSelect): SerialPublisherSelect {
  const {
    id,
    official_name,
    contact_persons,
    email_common,
    phone,
    address,
    city,
    zip,
    lang_code,
    additional_info,
    created,
    created_by,
    modified,
    modified_by,
  } = serialPublisher;

  return {
    id,
    official_name,
    contact_persons,
    email_common,
    phone,
    address,
    city,
    zip,
    lang_code,
    additional_info,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export interface SerialPublisherAutocompleteRead {
  id: number;
  official_name: string;
}

export function asSerialPublisherAutocompleteRead(
  serialPublisher: SerialPublisherSelect,
): SerialPublisherAutocompleteRead {
  const { id, official_name } = serialPublisher;
  return { id, official_name };
}
