import type { MonographMessageSelect } from '../../db/types/monograph/types-monograph-message.ts';

export interface MonographMessageInfo {
  id: number;
  message_type: string;
  monograph_publisher_id: number | null; // Always defined
  monograph_publisher_name: string | null; // Always defined
  monograph_publication_request_id: number | null; // For ISBN_ASSIGNMENT and ISMN_ASSIGNMENT
  expression_title: string | null; // For ISBN_ASSIGNMENT and ISMN_ASSIGNMENT
  manifestation_info:
    | {
        manifestation_type: string | null;
        identifier: string | null;
      }[]
    | null;
  isbn_publisher_range_id: number | null; // For ISBN_LIST_DELIVERY and ISMN_LIST_DELIVERY
  isbn_publisher_identifier: string | null; // For ISBN_LIST_DELIVERY and ISMN_LIST_DELIVERY
  ismn_publisher_range_id: number | null; // For ISBN_LIST_DELIVERY and ISMN_LIST_DELIVERY
  ismn_publisher_identifier: string | null; // For ISBN_LIST_DELIVERY and ISMN_LIST_DELIVERY
  recipient: string;
  lang_code: string;
  subject: string;
  body: string;
  sent: Date;
  sent_by: string;
}

export function asMonographMessageAdminRead(monographMessageInfo: MonographMessageInfo): MonographMessageInfo {
  const {
    id,
    message_type,
    monograph_publisher_id,
    monograph_publisher_name,
    monograph_publication_request_id,
    expression_title,
    manifestation_info,
    isbn_publisher_range_id,
    isbn_publisher_identifier,
    ismn_publisher_range_id,
    ismn_publisher_identifier,
    recipient,
    lang_code,
    subject,
    body,
    sent,
    sent_by,
  } = monographMessageInfo;

  return {
    id,
    message_type,
    monograph_publisher_id,
    monograph_publisher_name,
    monograph_publication_request_id,
    expression_title,
    manifestation_info,
    isbn_publisher_range_id,
    isbn_publisher_identifier,
    ismn_publisher_range_id,
    ismn_publisher_identifier,
    recipient,
    lang_code,
    subject,
    body,
    sent,
    sent_by,
  };
}

export function asMonographMessageSearchResult(
  monographMessage: MonographMessageSelect,
): Partial<MonographMessageSelect> {
  const { id, message_type, recipient, subject, sent, sent_by } = monographMessage;

  return {
    id,
    message_type,
    recipient,
    subject,
    sent,
    sent_by,
  };
}
