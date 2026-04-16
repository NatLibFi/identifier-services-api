import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import type { UpdateMonographPublicationManifestation } from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import type {
  MonographPublicationManifestationSelect,
  MonographPublicationManifestationUpdate,
} from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import { ApiError } from '../../utils/api-error.ts';

export async function updateMonographPublicationManifestation(
  id: number,
  updateDoc: UpdateMonographPublicationManifestation,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validatedDbResult = validateGetById<MonographPublicationManifestationSelect>(dbResult);

  // Some properties may not be updated if manifestation has been assigned an identifier
  const hasIdentifier = Boolean(validatedDbResult.isbn_identifier);
  const disallowedChangesAfterIdentifier = [
    'manifestation_type',
    'manifestation_type_other',
    'publication_year',
    'publication_month',
    'manifestation_edition',
  ];
  const keyRequiringNoIdentifier = Object.keys(updateDoc).find((k) => disallowedChangesAfterIdentifier.includes(k));

  if (hasIdentifier && keyRequiringNoIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher manifestation already has identifier assigned. Property ${keyRequiringNoIdentifier} cannot be changed after an identifier has been assigned.`,
    );
  }

  // JSON columns need separate handling
  const processedUpdateDoc: MonographPublicationManifestationUpdate = {
    ...updateDoc,
    authors: undefined,
    series: undefined,
    printing_information: undefined,
  };

  if ('authors' in updateDoc) {
    processedUpdateDoc.authors = JSON.stringify(updateDoc.authors);
  }

  if ('series' in updateDoc) {
    processedUpdateDoc.series = JSON.stringify(updateDoc.series);
  }

  if ('printing_information' in updateDoc) {
    processedUpdateDoc.printing_information = JSON.stringify(updateDoc.printing_information);
  }

  // Remove undefined values to have full control over update
  const definedUpdateDoc = removeUndefinedProperties(processedUpdateDoc);

  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication_manifestation')
      .set({
        ...definedUpdateDoc,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(updateResult.numUpdatedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }
  });

  return;
}
