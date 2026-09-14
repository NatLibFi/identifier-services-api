import type { SerialPublicationArchiveInsert } from '../../db/types/serial/types-serial-publication-archive.ts';
import type { SerialPublicationInsert } from '../../db/types/serial/types-serial-publication.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';

export function getSerialPublicationArchiveEntry(
  p: SerialPublicationInsert,
  publicationId: number,
): SerialPublicationArchiveInsert {
  return {
    serial_publication_id: publicationId,
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
    previous: p.previous,
    main_series: p.main_series,
    subseries: p.subseries,
    another_medium: p.another_medium,
    additional_info: p.additional_info,
    created: getCurrentTime(),
    created_by: p.created_by,
  };
}
