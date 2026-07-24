import HttpStatus from 'http-status';
import * as MarcRecordSerializers from '@natlibfi/marc-record-serializers';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime, removeUndefinedProperties, validateGetById } from '../shared-interface-utils.ts';
import { getExpressionsManifestations } from './monograph-publication-interface-utils.ts';
import generateMarcRecord from '../marc-record-interface.ts';

import { ApiError } from '../../utils/api-error.ts';
import {
  MARC_RECORD_FILTER,
  MARC_RECORD_FORMAT,
  MONOGRAPH_AUTHOR_ROLES,
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_MANIFESTATION_TYPES,
  MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL,
  MONOGRAPH_MANIFESTATION_TYPES_PRINT,
  MONOGRAPH_PUBLICATION_REQUEST_STATES,
} from '../../constants.ts';

import { asMonographPublicationExpressionAdminRead } from '../../dtl/monograph/monograph-publication-expression-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import type { RequestUser, UnknownObject } from '../../generic-types.ts';
import type {
  AddMonographPublicationExpression,
  UpdateMonographPublicationExpression,
} from '../../validations/monograph/monograph-publication-expression-validation.ts';
import type {
  MonographPublicationExpressionSelect,
  MonographPublicationExpressionUpdate,
} from '../../db/types/monograph/types-monograph-publication-expression.ts';
import type { GetMarcRecordHttp } from '../../validations/marc-record-validation.ts';
import type { CreateMarcRecordInformation } from '../marc-record-interface.ts';

export async function readMonographPublicationExpression(id: number) {
  const db = getKysely();

  const expression = await db.selectFrom('monograph_publication_expression').selectAll().where('id', '=', id).execute();

  const validatedExpression = validateGetById(expression);

  const manifestations = await getExpressionsManifestations([id]);
  const typedManifestations = manifestations[id] || []; // TS constraint is satisfied like this

  return asMonographPublicationExpressionAdminRead(validatedExpression, typedManifestations);
}

export async function updateMonographPublicationExpression(
  id: number,
  updateDoc: UpdateMonographPublicationExpression,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_expression').selectAll().where('id', '=', id).execute();
  validateGetById<MonographPublicationExpressionSelect>(dbResult);

  // JSON columns need separate handling
  const processedUpdateDoc: MonographPublicationExpressionUpdate = { ...updateDoc, authors: undefined };

  if ('authors' in updateDoc) {
    processedUpdateDoc.authors = JSON.stringify(updateDoc.authors);
  }

  const disallowedChangesAfterIdentifier = ['expression_type', 'expression_language'];
  const keyRequiringNoIdentifier = Object.keys(updateDoc).find((k) => disallowedChangesAfterIdentifier.includes(k));

  const { [id]: manifestations } = await getExpressionsManifestations([id]);
  const manifestationHasIdentifier = manifestations?.find(
    (m) => m.isbn_identifier !== null || m.ismn_identifier !== null,
  );

  // Updating certain attributes is prohibited after an identifier has been assigned to associated manifestation
  if (manifestationHasIdentifier && keyRequiringNoIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `One of expression manifestations already has an identifier assigned. Property ${keyRequiringNoIdentifier} cannot be changed after an identifier has been assigned for any manifestation.`,
    );
  }

  // During first save of any publication request related entry, request_state transfer occurs
  const publicationRequestId = manifestations?.find(
    (m) => m.monograph_publication_request_id,
  )?.monograph_publication_request_id;

  const publicationRequest = publicationRequestId
    ? await db.selectFrom('monograph_publication_request').select('request_state').executeTakeFirstOrThrow()
    : undefined;

  const updatePublicationRequest = publicationRequest?.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.NEW;

  // Remove undefined values to have full control over update
  const definedUpdateDoc = removeUndefinedProperties(processedUpdateDoc);

  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication_expression')
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

    // Update associated request if necessary
    if (publicationRequestId && updatePublicationRequest) {
      const requestUpdateResult = await trx
        .updateTable('monograph_publication_request')
        .set({
          request_state: MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS,
          modified: getCurrentTime(),
          modified_by: user.id,
        })
        .where('id', '=', publicationRequestId)
        .executeTakeFirstOrThrow();

      if (Number(requestUpdateResult.numUpdatedRows) !== 1) {
        throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
      }
    }
  });

  return readMonographPublicationExpression(id);
}

export async function addMonographPublicationExpression(
  createDoc: AddMonographPublicationExpression,
  user: RequestUser,
) {
  const {
    monograph_publication_id,
    expression_type,
    expression_language,
    authors,
    title,
    subtitle,
    map_scale,
    manifestations,
  } = createDoc;

  const db = getKysely();

  if (!monograph_publication_id) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Cannot create expression without adding it to publication');
  }

  // Validate publication through read - implicitly manages returning 404 in case entity does not exist
  await readMonographPublication(monograph_publication_id);

  // Note: Currently no constraints are placed regarding creation of exactly identical expressions.
  // I.e., it is possible to create another expression with similar type/language combination with matching title

  const dbDoc = {
    monograph_publication_id,
    expression_type,
    expression_language,
    authors: JSON.stringify(authors),
    title,
    subtitle,
    map_scale,
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  // Create within transaction and add manifestations
  const resultId = await db.transaction().execute(async (trx) => {
    const expressionResult = await trx
      .insertInto('monograph_publication_expression')
      .values(dbDoc)
      .executeTakeFirstOrThrow();

    const expressionResultId = Number(expressionResult.insertId);

    await Promise.all(
      manifestations.map(async (m) => {
        const dbManifestation = {
          ...m,
          monograph_publication_expression_id: expressionResultId,
          monograph_publication_request_id: null,
          series: JSON.stringify(m.series),
          printing_information: JSON.stringify(m.printing_information),
          cancelled: false,
          created: getCurrentTime(),
          created_by: user.id,
          modified: getCurrentTime(),
          modified_by: user.id,
        };

        await trx.insertInto('monograph_publication_manifestation').values(dbManifestation).executeTakeFirstOrThrow();
      }),
    );

    return expressionResultId;
  });

  return readMonographPublicationExpression(resultId);
}

export async function deleteMonographPublicationExpression(expressionId: number, allowLastExpressionDelete = false) {
  // Constraints:
  // - Cannot be last expression unless a separate flag is defined (allows utilizing interface for publication removal interface)
  // - Any manifestation cannot have identifier assigned

  const db = getKysely();
  const expression = await readMonographPublicationExpression(expressionId);
  const publication = await readMonographPublication(expression.monograph_publication_id);
  const numPublicationExpression = publication.expressions.length;

  if (!allowLastExpressionDelete && numPublicationExpression === 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove last expression. Use publication removal interface instead if you desire to remove the whole publication.',
    );
  }

  const someManifestationHasIdentifier = expression.manifestations.find(
    (m) => m.isbn_identifier !== null || m.ismn_identifier !== null,
  );

  if (someManifestationHasIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove expression which contains manifestations that have ISBN or ISMN identifier assigned to it.',
    );
  }

  // Remove manifestations and expression within one transaction
  await db.transaction().execute(async (trx) => {
    const manifestationRemoveResult = await trx
      .deleteFrom('monograph_publication_manifestation')
      .where('monograph_publication_expression_id', '=', expressionId)
      .executeTakeFirstOrThrow();

    // Sanity check
    const numDeletedManifestations = Number(manifestationRemoveResult.numDeletedRows);
    if (numDeletedManifestations !== expression.manifestations.length) {
      throw new Error('Removal of manifestations resulted into unexpected result. Rolling transaction back.');
    }

    const expressionRemoveResult = await trx
      .deleteFrom('monograph_publication_expression')
      .where('id', '=', expressionId)
      .executeTakeFirstOrThrow();

    const numDeletedExpressions = Number(expressionRemoveResult.numDeletedRows);
    if (numDeletedExpressions !== 1) {
      throw new Error('Removal of expression resulted into unexpected result. Rolling transaction back.');
    }
  });

  return;
}

// TODO: integration tests
export async function createMonographPublicationExpressionMarc(
  expressionId: number,
  opts: GetMarcRecordHttp,
): Promise<UnknownObject[] | string> {
  const { record_format, record_filter } = opts;

  const db = getKysely();
  const expression = await readMonographPublicationExpression(expressionId);

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

  // This will gather all ISBNs for same manifestation type to an array and place manifestation type as object key
  // i.e., {"PDF": ["978-951-1..."]}
  const isbnIdentifiers = expression.manifestations.reduce((p: Record<string, string[]>, n) => {
    if (n.isbn_identifier) {
      (p[`${n.manifestation_type}`] ??= []).push(n.isbn_identifier);
    }
    return p;
  }, {});

  // This will gather all ISBNs for same manifestation type to an array and place manifestation type as object key
  // i.e., {"PDF": ["978-951-1..."]}
  const ismnIdentifiers = expression.manifestations.reduce((p: Record<string, string[]>, n) => {
    if (n.ismn_identifier) {
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

  const printManifestations = expression.manifestations.filter((m) =>
    Object.keys(MONOGRAPH_MANIFESTATION_TYPES_PRINT).includes(m.manifestation_type),
  );

  const electronicalManifestations = expression.manifestations.filter((m) =>
    Object.keys(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL).includes(m.manifestation_type),
  );

  if (printManifestations.length > 0 && record_filter !== MARC_RECORD_FILTER.ELECTRONICAL_ONLY) {
    const printRecordInformation: CreateMarcRecordInformation = {
      ...publicationInfoBase,
      isElectronical: false,
      publicationYear: printManifestations[0]?.publication_year || undefined, // Use information from first manifestation for request
      publicationMonth: printManifestations[0]?.publication_month || undefined, // Use information from first manifestation for request
      printerName: printManifestations[0]?.printing_information[0]?.printing_house,
      printerPlace: printManifestations[0]?.printing_information[0]?.printing_house_city,
      edition: printManifestations[0]?.manifestation_edition,
      monographSeries: printManifestations[0]?.series,
    };

    const printRecord = generateMarcRecord(printRecordInformation);
    marcRecords.push(printRecord);
  }

  if (electronicalManifestations.length > 0 && record_filter !== MARC_RECORD_FILTER.PRINT_ONLY) {
    const audiobookTypes = [MONOGRAPH_MANIFESTATION_TYPES.CD_ROM, MONOGRAPH_MANIFESTATION_TYPES.MP3];
    const isBook = expression.expression_type === MONOGRAPH_EXPRESSION_TYPES.BOOK;
    const isAudiobook = isBook && expression.manifestations.some((m) => audiobookTypes.includes(m.manifestation_type));

    const electronicalRecordInformation: CreateMarcRecordInformation = {
      ...publicationInfoBase,
      isElectronical: true,
      isAudiobook,
      publicationYear: electronicalManifestations[0]?.publication_year || undefined, // Use information from first manifestation for request
      publicationMonth: electronicalManifestations[0]?.publication_month || undefined, // Use information from first manifestation for request
      printerName: electronicalManifestations[0]?.printing_information[0]?.printing_house,
      printerPlace: electronicalManifestations[0]?.printing_information[0]?.printing_house_city,
      edition: electronicalManifestations[0]?.manifestation_edition,
      monographSeries: electronicalManifestations[0]?.series,
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
