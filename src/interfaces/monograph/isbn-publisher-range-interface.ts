import ISBN from 'isbn3';
import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getCurrentTime, validateGetById } from '../interface-utils/common-interface-utils.ts';

import {
  canDeleteIsbnPublisherRange,
  generateIsbnIdentifierDbEntry,
  getIsbnIdentifiers,
  getNumberOfIdentifiers,
} from './isbn-publisher-range-interface-utils.ts';
import { generateRangeArray } from '../../utils/generic-utils.ts';
import { rangeContainsIdentifier } from '../interface-utils/range-interface-utils.ts';
import { getAvailableIsbnPublisherRanges } from './isbn-range-interface-utils.ts';

import { asIsbnIdentifierAdminRead } from '../../dtl/monograph/isbn-identifier-dtl.ts';

import type {
  CreateIsbnPublisherRangeHttp,
  GetIsbnPublisherRangeIdentifiersHttp,
} from '../../validations/monograph/isbn-publisher-range-validation.ts';
import type { CreatedResponse } from '../interface-common-types.ts';
import type { RequestUser } from '../../generic-types.ts';

export async function createIsbnPublisherRange(
  isbnPublisherRanceCreateDoc: CreateIsbnPublisherRangeHttp,
  user: RequestUser,
): Promise<CreatedResponse> {
  const { publisher_identifier, monograph_publisher_id, isbn_range_id } = isbnPublisherRanceCreateDoc;
  const db = getKysely();

  const isbnRange = await db.selectFrom('isbn_range').selectAll().where('id', '=', isbn_range_id).executeTakeFirst();
  if (!isbnRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Selected ISBN range id ${isbn_range_id} could not be found.`,
    );
  }

  if (!rangeContainsIdentifier(isbnRange, publisher_identifier)) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range id ${isbn_range_id} does not contain publisher identifier of ${publisher_identifier}.`,
    );
  }

  const availableIsbnRangePublisherRanges = await getAvailableIsbnPublisherRanges(isbnRange);
  const isAvailable = availableIsbnRangePublisherRanges.includes(publisher_identifier);
  const isLastAvailable = availableIsbnRangePublisherRanges.filter((v) => v !== publisher_identifier).length === 0;

  if (!isAvailable) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range id ${isbn_range_id} available ISBN publisher ranges do not contain publisher identifier of ${publisher_identifier}.`,
    );
  }

  const monographPublisher = await db
    .selectFrom('monograph_publisher')
    .selectAll()
    .where('id', '=', monograph_publisher_id)
    .executeTakeFirst();

  if (!monographPublisher) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Selected monograph publisher id ${monograph_publisher_id} could not be found.`,
    );
  }

  if (monographPublisher.has_quitted) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Selected monograph publisher id ${monograph_publisher_id} has quitted and cannot be assigned ISBN publisher identifiers to.`,
    );
  }

  // Sanity check
  const existingIsbnPublisherRange = await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('publisher_identifier', '=', publisher_identifier)
    .executeTakeFirst();

  if (existingIsbnPublisherRange !== undefined) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN publisher range ${publisher_identifier} has already been created and assigned to a monograph publisher.`,
    );
  }

  const associatedIsbnIdentifiers = getIsbnIdentifiers(publisher_identifier);

  // Processed within transaction to create ISBN identifiers associated with the ISBN publisher range in batches of 1k
  const resultId = await db.transaction().execute(async (trx) => {
    // When last ISBN publisher range is assigned, deactivate range
    if (isLastAvailable) {
      await trx
        .updateTable('isbn_range')
        .set({
          active: false,
          modified_by: user.id,
          modified: getCurrentTime(),
        })
        .where('id', '=', isbn_range_id)
        .executeTakeFirstOrThrow();
    }

    const result = await trx
      .insertInto('isbn_publisher_range')
      .values({
        publisher_identifier,
        monograph_publisher_id,
        isbn_range_id,
        created: getCurrentTime(),
        created_by: user.id,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .executeTakeFirstOrThrow();

    const publisherRangeId = Number(result.insertId);
    const numBatches = Math.ceil(associatedIsbnIdentifiers.length / 1000);

    await Promise.all(
      generateRangeArray(numBatches).map(async (batchIdx) => {
        const batchStart = 1000 * batchIdx;
        const batchMaxEnd = batchStart + 1000;
        const batchEnd =
          associatedIsbnIdentifiers.length >= batchMaxEnd ? batchMaxEnd : associatedIsbnIdentifiers.length;

        const batchIdentifiers = associatedIsbnIdentifiers.slice(batchStart, batchEnd);
        const batchDbEntries = batchIdentifiers.map((identifier) =>
          generateIsbnIdentifierDbEntry(identifier, publisherRangeId),
        );

        await trx.insertInto('isbn_identifier').values(batchDbEntries).execute();
      }),
    );

    return publisherRangeId;
  });

  return { id: resultId };
}

export async function deleteIsbnPublisherRange(isbnPublisherRangeId: number) {
  const db = getKysely();

  const isbnPublisherRange = await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('id', '=', isbnPublisherRangeId)
    .executeTakeFirst();

  if (!isbnPublisherRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `ISBN publisher range id ${isbnPublisherRangeId} could not be found.`,
    );
  }

  const allowRangeDeletion = await canDeleteIsbnPublisherRange(isbnPublisherRange);
  if (allowRangeDeletion.result === false) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN publisher range id ${isbnPublisherRangeId} cannot be deleted due to an constraint: ${allowRangeDeletion.reason}`,
    );
  }

  // Remove all associated identifiers in same transaction where the ISBN publisher identifier is removed
  await db.transaction().execute(async (trx) => {
    const isbnIdentifierResult = await trx
      .deleteFrom('isbn_identifier')
      .where('isbn_publisher_range_id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    // Verify removal of identifiers succeeded
    const expectedIdentifierDeleteCount = getNumberOfIdentifiers(isbnPublisherRange);

    if (Number(isbnIdentifierResult.numDeletedRows) !== expectedIdentifierDeleteCount) {
      throw new Error(
        `ISBN identifiers associated with ISBN publisher range were not properly deleted (count after delete was ${Number(isbnIdentifierResult.numDeletedRows)}).`,
      );
    }

    const publisherRangeResult = await trx
      .deleteFrom('isbn_publisher_range')
      .where('id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    if (Number(publisherRangeResult.numDeletedRows) !== 1) {
      throw new Error('Only ISBN publisher range should have been deleted.');
    }
  });

  return;
}

export async function getIsbnPublisherRangeIdentifiers(
  isbnPublisherRangeId: number,
  filter: GetIsbnPublisherRangeIdentifiersHttp,
) {
  const { download, limit, offset, assigned_only, unassigned_only } = filter;
  const db = getKysely();

  // TODO: evaluate access control

  // Verify publisher range exists
  const isbnPublisherRange = await db
    .selectFrom('isbn_publisher_range')
    .leftJoin('monograph_publisher', 'monograph_publisher.id', 'isbn_publisher_range.monograph_publisher_id')
    .select('isbn_publisher_range.id')
    .select('monograph_publisher.official_name as publisher_name')
    .where('isbn_publisher_range.id', '=', isbnPublisherRangeId)
    .execute();

  const validatedIsbnPublisherRange = validateGetById(isbnPublisherRange);
  const { publisher_name } = validatedIsbnPublisherRange;

  // Having association and official_name is mandatory, but sanity check that it really does exist
  if (!publisher_name) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Given ISBN range does not seem to have associated publisher name. Please contact system administration and ask reviewing ISBN range id ${isbnPublisherRangeId}`,
    );
  }

  let query = db.selectFrom('isbn_identifier').selectAll().where('isbn_publisher_range_id', '=', isbnPublisherRangeId);

  if (unassigned_only && assigned_only) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Cannot process unassigned_only and assigned_only simultaneously',
    );
  }

  if (download && (unassigned_only || assigned_only || limit || offset)) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Cannot process unassigned_only, assigned_only, limit or offset together with download',
    );
  }

  if (!download && unassigned_only) {
    query = query.where('monograph_publication_manifestation_id', 'is', null);
  }

  // Note: done like this to avoid case where assigned only filter would be applied when attribute is undefined
  if (!download && assigned_only) {
    query = query.where('monograph_publication_manifestation_id', 'is not', null);
  }

  query = query.orderBy('id', 'asc');

  if (!download && limit) {
    query = query.limit(limit);
  }

  if (!download && offset) {
    query = query.offset(offset);
  }

  const result = await query.execute();

  if (!download) {
    return result.map((r) => {
      // Re-validate just in case
      const auditResult = ISBN.audit(r.identifier);

      if (auditResult.validIsbn === false) {
        throw new Error(`External audit has flagged ISBN ${r.identifier} as invalid.`);
      }

      if (auditResult.groupname !== 'Finland') {
        throw new Error(`External audit has flagged ISBN ${r.identifier} as non-Finnish.`);
      }

      return asIsbnIdentifierAdminRead(r);
    });
  }

  // Process downloading as text file

  // Old API's formatting for text files
  let headerText = `Seuraavat tunnukset on myönnetty kustantajalle ${publisher_name}\r\n`;
  headerText += `Följande identifikatorer har tilldelats åt förlaget ${publisher_name}\r\n`;
  headerText += `Following identifiers have been assigned to publisher ${publisher_name}\r\n\r\n`;

  // Add test header for test environment
  if (process.env['NODE_ENV'] !== 'production') {
    headerText +=
      'SEURAAVAT TUNNUKSET ON TUOTETTU TESTIJÄRJESTELMÄSTÄ JA NIITÄ EI MISSÄÄN NIMESSÄ PIDÄ OIKEASTI KÄYTTÄÄ!\r\n';
    headerText += 'FÖLJANDE IDENTIFIKATORER ÄR FRÅN TEST SYSTEMET. ANVÄND DEM INTE!\r\n';
    headerText += 'FOLLOWING IDENTIFIERS HAVE BEEN PRODUCED IN TEST SYSTEM. DO NOT USE THEM!\r\n\r\n';
  }

  const identifierResult = result.reduce((acc, { identifier, monograph_publication_manifestation_id }) => {
    // Re-validate just in case
    const auditResult = ISBN.audit(identifier);

    if (auditResult.validIsbn === false) {
      throw new Error(`External audit has flagged ISBN ${identifier} as invalid.`);
    }

    if (auditResult.groupname !== 'Finland') {
      throw new Error(`External audit has flagged ISBN ${identifier} as non-Finnish.`);
    }

    let identifierInfo = `${acc}${identifier}`;

    if (monograph_publication_manifestation_id !== null) {
      identifierInfo += ' KÄYTETTY/BEGAGNAD/USED';
    }

    return `${identifierInfo}\r\n`;
  }, '');

  // TODO: evaluate if downloads table is required
  return `${headerText}${identifierResult}`;
}
