import HttpStatus from 'http-status';
import * as MarcRecordSerializers from '@natlibfi/marc-record-serializers';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';
import {
  MARC_RECORD_FORMAT,
  MONOGRAPH_AUTHOR_ROLES,
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_IDENTIFIERS,
  MONOGRAPH_MANIFESTATION_TYPES,
  MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL,
  MONOGRAPH_MANIFESTATION_TYPES_PRINT,
  MONOGRAPH_PUBLICATION_REQUEST_STATES,
} from '../../constants.ts';

import { getApplicationLogger } from '../../utils/logging.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
  validateRowsUpdatedExact,
} from '../shared-interface-utils.ts';
import { getExpressionIdentifierType } from './monograph-identifier-utils.ts';
import { assignIsbnIdentifier, deassignIsbnIdentifier, getAssignableIsbnIdentifier } from './isbn-identifier-utils.ts';
import { assignIsmnIdentifier, deassignIsmnIdentifier, getAssignableIsmnIdentifier } from './ismn-identifier-utils.ts';
import { readMonographPublicationExpression } from './monograph-publication-expression-interface.ts';
import { validateAddManifestationRequest } from './monograph-publication-manifestation-interface-utils.ts';

import { asMonographPublicationManifestationAdminRead } from '../../dtl/monograph/monograph-publication-manifestation-dtl.ts';
import { changeStatusNewToProcessed } from './monograph-publication-request-interface-utils.ts';
import generateMarcRecord from '../marc-record-interface.ts';

import type { RequestUser, UnknownObject } from '../../generic-types.ts';
import type {
  AddMonographPublicationManifestation,
  UpdateMonographPublicationManifestation,
} from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import type {
  MonographPublicationManifestationSelect,
  MonographPublicationManifestationUpdate,
} from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import type { CreateMarcRecordInformation } from '../marc-record-interface.ts';
import type { GetMarcRecordHttp } from '../../validations/marc-record-validation.ts';

export async function readMonographPublicationManifestation(id: number) {
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier', 'isbn_identifier.modified as isbn_identifier_assigned'])
    .select(['ismn_identifier.identifier as ismn_identifier', 'ismn_identifier.modified as ismn_identifier_assigned'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const { numMessages } = await db
    .selectFrom('monograph_message_publication_manifestation')
    .select(db.fn.countAll<number>().as('numMessages'))
    .where('monograph_publication_manifestation_id', '=', id)
    .executeTakeFirstOrThrow();

  const validatedManifestation = validateGetById(manifestation);
  return asMonographPublicationManifestationAdminRead(validatedManifestation, numMessages > 0);
}

export async function updateMonographPublicationManifestation(
  id: number,
  updateDoc: UpdateMonographPublicationManifestation,
  user: RequestUser,
) {
  const db = getKysely();

  const origManifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .select(['ismn_identifier.identifier as ismn_identifier'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validatedOrigManifestation = validateGetById<MonographPublicationManifestationSelect>(origManifestation);

  // Some properties may not be updated if manifestation has been assigned an identifier
  const hasIdentifier =
    Boolean(validatedOrigManifestation.isbn_identifier) || Boolean(validatedOrigManifestation.ismn_identifier);

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
    series: undefined,
    printing_information: undefined,
  };

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

    validateRowsUpdatedExact(updateResult, 1);

    // Update associated request state if necessary
    if (validatedOrigManifestation.monograph_publication_request_id) {
      await changeStatusNewToProcessed(validatedOrigManifestation.monograph_publication_request_id, user, trx);
    }
  });

  return readMonographPublicationManifestation(id);
}

export async function addMonographPublicationManifestation(
  createDoc: AddMonographPublicationManifestation,
  user: RequestUser,
) {
  const {
    monograph_publication_request_id,
    monograph_publication_expression_id,
    manifestation_type,
    manifestation_type_other,
    manifestation_edition,
    publication_month,
    publication_year,
    series,
    printing_information,
  } = createDoc;

  const db = getKysely();

  // Sanity check
  if (!monograph_publication_expression_id) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Cannot create manifestation without adding it to expression');
  }

  // Validate expression through using interface read - implicitly manages returning 404 in case entity does not exist
  const expression = await readMonographPublicationExpression(monograph_publication_expression_id);

  // Validate operation from perspective of administrator adding new manifestation to existing request
  await validateAddManifestationRequest(user, expression.monograph_publication_id, monograph_publication_request_id);

  // Cast all falsy values to null for comparison to be consistent
  const castManifestationTypeOther = !manifestation_type_other ? null : manifestation_type_other;
  const castManifestationEdition = !manifestation_edition ? null : manifestation_edition;

  const matchingManifestation = expression.manifestations.find((m) => {
    const mCastManifestationTypeOther = !m.manifestation_type_other ? null : m.manifestation_type_other;
    const mCastManifestationEdition = !m.manifestation_edition ? null : m.manifestation_edition;

    const matchingType = m.manifestation_type === manifestation_type;
    const matchingTypeOther = mCastManifestationTypeOther === castManifestationTypeOther;
    const matchingEdition = mCastManifestationEdition === castManifestationEdition;
    const matchingPublicationYear = m.publication_year === publication_year;
    const matchingPublicationMonth = m.publication_month === publication_month;

    const conditions = [
      matchingType,
      matchingTypeOther,
      matchingEdition,
      matchingPublicationYear,
      matchingPublicationMonth,
    ];

    return conditions.every((c) => c);
  });

  if (matchingManifestation) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot create manifestation that contains exactly equal information as some existing manifestation',
    );
  }

  const dbDoc = {
    monograph_publication_expression_id,
    monograph_publication_request_id: monograph_publication_request_id ?? null,
    cancelled: false,
    manifestation_type,
    manifestation_type_other: manifestation_type_other ?? null,
    manifestation_edition: manifestation_edition ?? null,
    publication_month,
    publication_year,
    series: JSON.stringify(series),
    printing_information: JSON.stringify(printing_information),
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  // Insert to db
  const { insertId } = await db
    .insertInto('monograph_publication_manifestation')
    .values(dbDoc)
    .executeTakeFirstOrThrow();

  // Respond with result
  return readMonographPublicationManifestation(Number(insertId));
}

export async function assignManifestationIdentifier(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'monograph_publication_request',
      'monograph_publication_request.id',
      'monograph_publication_manifestation.monograph_publication_request_id',
    )
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .select(['ismn_identifier.identifier as ismn_identifier'])
    .select(['monograph_publication_request.request_state as request_state'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validManifestation = validateGetById(manifestation);

  if (validManifestation.isbn_identifier) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Manifestation has already ISBN identifier assigned to it.');
  }

  if (validManifestation.ismn_identifier) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Manifestation has already ISMN identifier assigned to it.');
  }

  // Disallow assigning identifier for entries associated with rejected request
  if (validManifestation.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.REJECTED) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Publication manifestation is associated rejected publisher request.',
    );
  }

  // Check identifier type for expression
  const identifierType = await getExpressionIdentifierType(validManifestation.monograph_publication_expression_id);

  try {
    if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
      const isbnIdentifier = await getAssignableIsbnIdentifier(id);

      await db.transaction().execute(async (trx) => {
        await assignIsbnIdentifier(id, isbnIdentifier, trx, user);
      });

      return readMonographPublicationManifestation(id);
    }

    if (identifierType === MONOGRAPH_IDENTIFIERS.ISMN) {
      const ismnIdentifier = await getAssignableIsmnIdentifier(id);

      await db.transaction().execute(async (trx) => {
        await assignIsmnIdentifier(id, ismnIdentifier, trx, user);
      });

      return readMonographPublicationManifestation(id);
    }

    // Note: this part of code should never be reached. There however exist an ApiError to catch this case also.
  } catch (error) {
    const hasDetails = error instanceof Error;
    if (!hasDetails) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Unknown error occurred during identifier assignation.',
      );
    }

    if (error.cause === 'Inadequate number of identifiers') {
      throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Publisher does not have enough available identifiers.');
    }

    if (error.cause === 'No publisher defined') {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'Publication manifestation is associated with does not have publisher defined.',
      );
    }

    // Catch-all in case some cause is added to function but forgotten to add here
    logger.warn(`Underlying cause for error: ${error.cause}`);
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown error occurred during identifier assignation.',
    );
  }

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    'Unprocessable expression_type: ISBN or ISMN identifier cannot be assigned to manifestation due to this. Please contact system administration.',
  );
}

export async function deassignManifestationIdentifier(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  // Refuse to deassign identifier that has been already sent as message
  const { numMessages } = await db
    .selectFrom('monograph_message_publication_manifestation')
    .select(db.fn.countAll<number>().as('numMessages'))
    .where('monograph_publication_manifestation_id', '=', id)
    .executeTakeFirstOrThrow();

  if (numMessages > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'A message has already been sent regarding manifestation. Refusing to deassign any identifier that has been messaged.',
    );
  }

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'monograph_publication_request',
      'monograph_publication_request.id',
      'monograph_publication_manifestation.monograph_publication_request_id',
    )
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .select(['ismn_identifier.identifier as ismn_identifier'])
    .select(['monograph_publication_request.request_state as request_state'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validManifestation = validateGetById(manifestation);

  if (!validManifestation.isbn_identifier && !validManifestation.ismn_identifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Manifestation does not have ISBN or ISMN identifier assigned to it.',
    );
  }

  // Check identifier type for expression
  const identifierType = await getExpressionIdentifierType(validManifestation.monograph_publication_expression_id);

  try {
    if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
      await db.transaction().execute(async (trx) => {
        await deassignIsbnIdentifier(id, trx, user);
      });

      return readMonographPublicationManifestation(id);
    }

    if (identifierType === MONOGRAPH_IDENTIFIERS.ISMN) {
      await db.transaction().execute(async (trx) => {
        await deassignIsmnIdentifier(id, trx, user);
      });

      return readMonographPublicationManifestation(id);
    }
  } catch (error) {
    logger.warn('Unexpected error during deassigning manifestation identifier: ', error);
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown error occurred during identifier deassignation.',
    );
  }

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    'Could not process linked expression expression_type.',
  );
}

export async function deleteMonographPublicationManifestation(manifestationId: number) {
  // Constraints:
  // - Cannot be expression's last manifestation
  // - Cannot have identifier assigned
  // - Cannot have message sent

  const db = getKysely();
  const manifestation = await readMonographPublicationManifestation(manifestationId);

  if (manifestation.isbn_identifier || manifestation.ismn_identifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove manifestation that has identifier assigned to it.',
    );
  }

  if (manifestation.message_sent) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove manifestation that has had message sent regarding it.',
    );
  }

  const expression = await readMonographPublicationExpression(manifestation.monograph_publication_expression_id);
  if (expression.manifestations.length === 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove last manifestation of an expression. Please remove the expression.',
    );
  }

  await db.transaction().execute(async (trx) => {
    const deleteResult = await trx
      .deleteFrom('monograph_publication_manifestation')
      .where('id', '=', manifestationId)
      .executeTakeFirstOrThrow();

    const numDeleted = Number(deleteResult.numDeletedRows);

    if (numDeleted !== 1) {
      throw new Error('Manifestation deletion resulted into unexpected outcome. Initiating rollback.');
    }
  });

  return;
}

export async function getMonographManifestationRelations(manifestationId: number) {
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'monograph_publication_expression',
      'monograph_publication_expression.id',
      'monograph_publication_manifestation.monograph_publication_expression_id',
    )
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'monograph_publication',
      'monograph_publication.id',
      'monograph_publication_expression.monograph_publication_id',
    )
    .select([
      'monograph_publication_manifestation.id as manifestationId',
      'monograph_publication_manifestation.cancelled as manifestationCancelled',
      'monograph_publication_manifestation.monograph_publication_request_id as requestId',
      'monograph_publication_expression.id as expressionId',
      'monograph_publication_expression.title as expressionTitle',
      'monograph_publication_expression.subtitle as expressionSubtitle',
      'monograph_publication.monograph_publisher_id as publisherId',
      'isbn_identifier.identifier as isbnIdentifier',
      'ismn_identifier.identifier as ismnIdentifier',
    ])
    .where('monograph_publication_manifestation.id', '=', manifestationId)
    .execute();

  const validatedManifestationPublisherInfo = validateGetById(manifestation);
  return validatedManifestationPublisherInfo;
}

// Important note: record is not generated from cancelled manifestations or manifestations with SET type
export async function createMonographPublicationManifestationMarc(
  manifestationId: number,
  opts: GetMarcRecordHttp,
): Promise<UnknownObject[] | string> {
  const { record_format } = opts;

  const db = getKysely();
  const manifestation = await readMonographPublicationManifestation(manifestationId);
  const expression = await readMonographPublicationExpression(manifestation.monograph_publication_expression_id);

  // For publisher information: prioritize using publisher request, but fall back to publisher registry information if request is not found
  const [publisherInformation] = await db
    .selectFrom('monograph_publication')
    .leftJoin('monograph_publisher', 'monograph_publisher.id', 'monograph_publication.monograph_publisher_id')
    .selectAll('monograph_publisher')
    .where('monograph_publication.id', '=', expression.monograph_publication_id)
    .execute();

  const [publicationRequest] = await db
    .selectFrom('monograph_publication_request')
    .selectAll('monograph_publication_request')
    .where('monograph_publication_request.monograph_publication_id', '=', expression.monograph_publication_id)
    .execute();

  let publisherName = null;
  let publisherPlace = null;

  if (publicationRequest) {
    publisherName = publicationRequest.official_name;
    publisherPlace =
      expression.expression_type === MONOGRAPH_EXPRESSION_TYPES.DISSERTATION
        ? publicationRequest.locality
        : publicationRequest.city;
  } else if (publisherInformation) {
    publisherName = publisherInformation.official_name;
    publisherPlace = publisherInformation.city;
  }

  const marcRecords: UnknownObject[] = [];

  const mainAuthor = expression.authors.find((a) => a.roles.includes(MONOGRAPH_AUTHOR_ROLES.AUTHOR));
  const contributors = mainAuthor
    ? expression.authors.filter((a) => a.first_name === mainAuthor.first_name && a.last_name === mainAuthor.last_name)
    : expression.authors;

  // This will gather SET ISBNs for same manifestation type
  const isPrintManifestation = Object.keys(MONOGRAPH_MANIFESTATION_TYPES_PRINT).includes(
    manifestation.manifestation_type,
  );

  const isElectronicalManifestation = Object.keys(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL).includes(
    manifestation.manifestation_type,
  );

  if (!isPrintManifestation && !isElectronicalManifestation) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Manifestation is not either print or electronical type. MARC records cannot be generated for SET type of manifestations.',
    );
  }

  const isbnIdentifiers = expression.manifestations.reduce((p: Record<string, string[]>, n) => {
    if (n.isbn_identifier && !n.cancelled) {
      (p[`${n.manifestation_type}`] ??= []).push(n.isbn_identifier);
    }

    return p;
  }, {});

  const ismnIdentifiers = expression.manifestations.reduce((p: Record<string, string[]>, n) => {
    if (n.ismn_identifier && !n.cancelled) {
      (p[`${n.manifestation_type}`] ??= []).push(n.ismn_identifier);
    }

    return p;
  }, {});

  const publicationInfoBase: CreateMarcRecordInformation = {
    isElectronical: false, // placeholder to satisfy typing - will be overwritten appropriately
    isMonograph: true,
    isSerial: false,
    isSheetMusic: expression.expression_type === MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC,
    isDissertation: expression.expression_type === MONOGRAPH_EXPRESSION_TYPES.DISSERTATION,
    isMap: expression.expression_type === MONOGRAPH_EXPRESSION_TYPES.MAP,
    isAudiobook: false, // just a default for now as this cannot be true when isElectronical is false
    title: expression.title,
    subtitle: expression.subtitle,
    isbnIdentifiers,
    ismnIdentifiers,
    language: expression.expression_language,
    publisherName,
    publisherPlace,
    mapScale: expression.map_scale,
    mainAuthor,
    contributors,
  };

  if (isPrintManifestation) {
    // For print only one MARC record is generated
    const printRecordInformation: CreateMarcRecordInformation = {
      ...publicationInfoBase,
      isElectronical: false,
      publicationYear: manifestation.publication_year || undefined, // Use information from first manifestation for request
      publicationMonth: manifestation.publication_month || undefined, // Use information from first manifestation for request
      printerName: manifestation.printing_information[0]?.printing_house,
      printerPlace: manifestation.printing_information[0]?.printing_house_city,
      edition: manifestation.manifestation_edition,
      monographSeries: manifestation.series,
    };

    const printRecord = generateMarcRecord(printRecordInformation);
    marcRecords.push(printRecord);
  } else if (isElectronicalManifestation) {
    const audiobookTypes = [MONOGRAPH_MANIFESTATION_TYPES.CD_ROM, MONOGRAPH_MANIFESTATION_TYPES.MP3];
    const isAudiobook = audiobookTypes.includes(manifestation.manifestation_type);

    const electronicalRecordInformation: CreateMarcRecordInformation = {
      ...publicationInfoBase,
      manifestationType: manifestation.manifestation_type,
      isElectronical: true,
      isAudiobook,
      isMp3: manifestation.manifestation_type === MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL.MP3,
      publicationYear: manifestation.publication_year || undefined,
      publicationMonth: manifestation.publication_month || undefined,
      printerName: manifestation.printing_information[0]?.printing_house,
      printerPlace: manifestation.printing_information[0]?.printing_house_city,
      edition: manifestation.manifestation_edition,
      monographSeries: manifestation.series,
    };

    const electronicalRecord = generateMarcRecord(electronicalRecordInformation);
    marcRecords.push(electronicalRecord);
  }

  if (record_format === MARC_RECORD_FORMAT.MARC_RECORD_JS) {
    return marcRecords;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializableRecords = marcRecords.map((r: any) =>
    MarcRecordSerializers.Json.from(JSON.stringify(r.toObject())),
  );

  if (record_format === MARC_RECORD_FORMAT.TEXT) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializableRecords.map((r: any) => MarcRecordSerializers.Text.to(r)).join('\n\n');
  }

  if (record_format === MARC_RECORD_FORMAT.ISO2709) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializableRecords.map((r: any) => MarcRecordSerializers.ISO2709.to(r)).join('');
  }

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    `Could not serialize marc records to format ${record_format}.`,
  );
}
