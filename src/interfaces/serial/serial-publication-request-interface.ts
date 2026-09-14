import { getKysely } from '../../db/database.ts';

import { validateRowsInserted } from '../shared-interface-utils.ts';

import { getSerialPublicationArchiveEntry } from './serial-publication-interface-utils.ts';
import { getArchiveEntry, getDbSerialPublicationRequestEntries } from './serial-publication-request-interface-utils.ts';

import type { CreateSerialPublicationRequestHttp } from '../../validations/serial/serial-publication-request-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { SerialPublicationInsert } from '../../db/types/serial/types-serial-publication.ts';

export async function createSerialPublicationRequest(
  serialPublicationRequestCreateDoc: CreateSerialPublicationRequestHttp,
  user: RequestUser,
) {
  const { request, publications } = getDbSerialPublicationRequestEntries(serialPublicationRequestCreateDoc, user);

  const db = getKysely();

  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Create request
    const requestResult = await trx.insertInto('serial_publication_request').values(request).executeTakeFirstOrThrow();
    validateRowsInserted(requestResult, 1);

    const requestId = Number(requestResult.insertId);

    // 2. Create request archive entry
    const requestArchiveEntry = getArchiveEntry(request, requestId);
    const requestArchiveResult = await trx
      .insertInto('serial_publication_request_archive')
      .values(requestArchiveEntry)
      .executeTakeFirstOrThrow();
    validateRowsInserted(requestArchiveResult, 1);

    // 3. For each publication create publication entry and publication archive entry
    await Promise.all(
      publications.map(async (p) => {
        const publicationInsertInfo: SerialPublicationInsert = {
          serial_publication_request_id: requestId,
          ...p,
        };
        const publicationResult = await trx
          .insertInto('serial_publication')
          .values(publicationInsertInfo)
          .executeTakeFirstOrThrow();

        validateRowsInserted(publicationResult, 1);

        const publicationResultId = Number(publicationResult.insertId);

        // 4. Create publication archive entry
        const publicationArchiveEntry = getSerialPublicationArchiveEntry(publicationInsertInfo, publicationResultId);

        const publicationArchiveResult = await trx
          .insertInto('serial_publication_archive')
          .values(publicationArchiveEntry)
          .executeTakeFirstOrThrow();
        validateRowsInserted(publicationArchiveResult, 1);
      }),
    );

    return requestId;
  });

  return { id: resultId };
}
