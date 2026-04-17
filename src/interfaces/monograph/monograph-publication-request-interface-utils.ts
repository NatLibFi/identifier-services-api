import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime } from '../interface-utils/common-interface-utils.ts';

import { readMonographPublication } from './monograph-publication-interface.ts';

import {
  APPLICATION_USER_UI_PUBLIC,
  MONOGRAPH_MANIFESTATION_TYPES,
  MONOGRAPH_PUBLICATION_REQUEST_STATES,
} from '../../constants.ts';
import {
  monographExpressionAuthorRoleEnum,
  monographManifestationAuthorRoleEnum,
} from '../../validations/common-validation-enum.ts';

import type {
  CreateMonographPublicationRequestV1Http,
  CreateMonographPublicationRequestV2Http,
} from '../../validations/monograph/monograph-publication-request-validation.ts';
import type { CreateMonographPublicationManifestation } from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import type { MonographPrintingInformation } from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import { ApiError } from '../../utils/api-error.ts';

export function getExpressionAuthorV1(firstName?: string, lastName?: string, roles?: string[]) {
  if (!firstName || !lastName || !roles || roles.length === 0) {
    return null;
  }

  const expressionAuthorRoles = roles.filter((r) => monographExpressionAuthorRoleEnum.includes(r));
  if (expressionAuthorRoles.length === 0) {
    return null;
  }

  return {
    first_name: firstName,
    last_name: lastName,
    isni: null,
    roles: expressionAuthorRoles,
  };
}

export function getManifestationAuthorV1(firstName?: string, lastName?: string, roles?: string[]) {
  if (!firstName || !lastName || !roles || roles.length === 0) {
    return null;
  }

  const manifestationAuthorRoles = roles.filter((r) => monographManifestationAuthorRoleEnum.includes(r));
  if (manifestationAuthorRoles.length === 0) {
    return null;
  }

  return {
    first_name: firstName,
    last_name: lastName,
    isni: null,
    roles: manifestationAuthorRoles,
  };
}

export function getDbPublicationEntry(
  monographPublicationRequestCreateDoc:
    | CreateMonographPublicationRequestV1Http
    | CreateMonographPublicationRequestV2Http,
  user: RequestUser,
) {
  const { version } = monographPublicationRequestCreateDoc;

  if (version === 1) {
    return getDbPublicationEntryV1(monographPublicationRequestCreateDoc, user);
  }

  if (version === 2) {
    return getDbPublicationEntryV2(monographPublicationRequestCreateDoc, user);
  }

  throw new Error('Unsupported version for Monograph Publication Request');
}

export function getDbPublicationEntryV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
) {
  return {
    monograph_publisher_id: null,
    primary_title: monographPublicationRequestCreateDoc.title,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export function getDbPublicationEntryV2(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV2Http,
  user: RequestUser,
) {
  const firstExpression = monographPublicationRequestCreateDoc.expressions[0];
  if (!firstExpression) {
    throw new Error('Cannot create MonographPublication without at least one expression');
  }

  return {
    monograph_publisher_id: null,
    primary_title: firstExpression.title,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export function getDbPublicationRequestEntry(
  monographPublicationRequestCreateDoc:
    | CreateMonographPublicationRequestV1Http
    | CreateMonographPublicationRequestV2Http,
  user: RequestUser,
  publicationId: number,
) {
  const { version } = monographPublicationRequestCreateDoc;

  if (version === 1) {
    return getDbPublicationRequestEntryV1(monographPublicationRequestCreateDoc, user, publicationId);
  }

  if (version === 2) {
    return getDbPublicationRequestEntryV2(monographPublicationRequestCreateDoc, user, publicationId);
  }

  throw new Error('Unsupported version for Monograph Publication Request');
}

export function getDbPublicationRequestEntryV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
  publicationId: number,
) {
  return {
    monograph_publisher_id: null,
    monograph_publication_id: publicationId,
    official_name: monographPublicationRequestCreateDoc.officialName,
    publisher_identifier_str: monographPublicationRequestCreateDoc.publisherIdentifierStr ?? null,
    locality: monographPublicationRequestCreateDoc.locality ?? null,
    address: monographPublicationRequestCreateDoc.address ?? null,
    zip: monographPublicationRequestCreateDoc.zip ?? null,
    city: monographPublicationRequestCreateDoc.city ?? null,
    phone: monographPublicationRequestCreateDoc.phone ?? null,
    email: monographPublicationRequestCreateDoc.email ?? null,
    lang_code: monographPublicationRequestCreateDoc.langCode,
    contact_person: monographPublicationRequestCreateDoc.contactPerson,
    published_before: monographPublicationRequestCreateDoc.publishedBefore,
    publishing_activity: monographPublicationRequestCreateDoc.publishingActivity,
    publishing_activity_amount: monographPublicationRequestCreateDoc.publishingActivityAmount ?? null,
    publications_intra: !monographPublicationRequestCreateDoc.publicationsPublic,
    publications_public: monographPublicationRequestCreateDoc.publicationsPublic,
    comments: monographPublicationRequestCreateDoc.comments ?? null,
    request_state: 'NEW',
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export function getDbPublicationRequestEntryV2(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV2Http,
  user: RequestUser,
  publicationId: number,
) {
  const { request } = monographPublicationRequestCreateDoc;

  return {
    monograph_publisher_id: null,
    monograph_publication_id: publicationId,
    official_name: request.official_name,
    publisher_identifier_str: request.publisher_identifier_str ?? null,
    locality: request.locality ?? null,
    address: request.address ?? null,
    zip: request.zip ?? null,
    city: request.city ?? null,
    phone: request.phone ?? null,
    email: request.email ?? null,
    lang_code: request.lang_code,
    contact_person: request.contact_person,
    published_before: request.published_before,
    publishing_activity: request.publishing_activity,
    publishing_activity_amount: request.publishing_activity_amount ?? null,
    publications_intra: !request.publications_public,
    publications_public: request.publications_public,
    comments: request.comments ?? null,
    request_state: 'NEW',
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export function getDbPublicationExpressionEntry(
  monographPublicationRequestCreateDoc:
    | CreateMonographPublicationRequestV1Http
    | CreateMonographPublicationRequestV2Http,
  user: RequestUser,
  publicationId: number,
) {
  const { version } = monographPublicationRequestCreateDoc;

  if (version === 1) {
    return getDbPublicationExpressionEntryV1(monographPublicationRequestCreateDoc, user, publicationId);
  }

  if (version === 2) {
    return getDbPublicationExpressionEntryV2(monographPublicationRequestCreateDoc, user, publicationId);
  }

  throw new Error('Unsupported version for Monograph Publication Request');
}

export function getDbPublicationExpressionEntryV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
  publicationId: number,
) {
  const {
    title,
    subtitle,
    firstName1,
    lastName1,
    role1,
    firstName2,
    lastName2,
    role2,
    firstName3,
    lastName3,
    role3,
    firstName4,
    lastName4,
    role4,
  } = monographPublicationRequestCreateDoc;

  return [
    {
      monograph_publication_id: publicationId,
      expression_type: monographPublicationRequestCreateDoc.publicationType,
      expression_language: monographPublicationRequestCreateDoc.language,
      authors: JSON.stringify(
        [
          getExpressionAuthorV1(firstName1, lastName1, role1),
          getExpressionAuthorV1(firstName2, lastName2, role2),
          getExpressionAuthorV1(firstName3, lastName3, role3),
          getExpressionAuthorV1(firstName4, lastName4, role4),
        ].filter((v) => v !== null),
      ),
      title,
      subtitle: subtitle ?? null,
      manifestations: getDbPublicationManifestationEntriesV1(monographPublicationRequestCreateDoc, user),
      created: getCurrentTime(),
      created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
      modified: getCurrentTime(),
      modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    },
  ];
}

export function getDbPublicationExpressionEntryV2(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV2Http,
  user: RequestUser,
  publicationId: number,
) {
  const { expressions } = monographPublicationRequestCreateDoc;
  return expressions.map(({ manifestations, authors, ...rest }) => ({
    ...rest,
    authors: JSON.stringify(authors),
    monograph_publication_id: publicationId,
    manifestations: manifestations.map((m) => getDbPublicationManifestationEntriesV2(m, user)),
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  }));
}

export function getManifestationBase(
  type: string,
  printingInformation: MonographPrintingInformation[],
  typeOther?: string,
) {
  const typeRequiresOtherDef = [
    MONOGRAPH_MANIFESTATION_TYPES.OTHER,
    MONOGRAPH_MANIFESTATION_TYPES.OTHER_PRINT,
  ].includes(type);

  return {
    manifestation_type: type,
    manifestation_type_other: typeRequiresOtherDef ? typeOther : null,
    printing_information: JSON.stringify(printingInformation),
  };
}

export function getDbPublicationManifestationEntriesV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
  expressionId?: number,
  monographPublicationRequestId?: number | null,
) {
  const {
    firstName1,
    lastName1,
    role1,
    firstName2,
    lastName2,
    role2,
    firstName3,
    lastName3,
    role3,
    firstName4,
    lastName4,
    role4,
    type,
    typeOther,
    fileformat,
    fileformatOther,
    year,
    month,
    printingHouse,
    printingHouseCity,
    copies,
    edition,
    mapScale,
    series,
    volume,
    issn,
  } = monographPublicationRequestCreateDoc;

  const printingInformation = printingHouse // Generate printing_information entry only if printing_house information is available
    ? [
        {
          printing_house: printingHouse ?? null,
          printing_house_city: printingHouseCity ?? null,
          copies: copies ?? null,
        },
      ]
    : [];

  const seriesInformation =
    Boolean(series) || Boolean(issn) // Generate series information entry if series or issn is defined. Otherwise do not generate entry.
      ? [
          {
            name: series ?? null,
            issn: issn ?? null,
            volume: volume ?? null,
          },
        ]
      : [];

  const printManifestations = type?.map((t) => getManifestationBase(t, printingInformation, typeOther)) ?? [];
  const electronicalManifestations = fileformat?.map((ff) => getManifestationBase(ff, [], fileformatOther)) ?? [];

  const manifestationBaseEntries = printManifestations.concat(electronicalManifestations);

  return manifestationBaseEntries.map((base) => ({
    monograph_publication_expression_id: expressionId,
    monograph_publication_request_id: monographPublicationRequestId,
    ...base,
    cancelled: false,
    manifestation_edition: edition ?? null,
    map_scale: mapScale ?? null,
    publication_year: year,
    publication_month: month,
    authors: JSON.stringify(
      [
        getManifestationAuthorV1(firstName1, lastName1, role1),
        getManifestationAuthorV1(firstName2, lastName2, role2),
        getManifestationAuthorV1(firstName3, lastName3, role3),
        getManifestationAuthorV1(firstName4, lastName4, role4),
      ].filter((v) => v !== null),
    ),
    series: JSON.stringify(seriesInformation),
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  }));
}

export function getDbPublicationManifestationEntriesV2(
  manifestationCreateDoc: CreateMonographPublicationManifestation,
  user: RequestUser,
  expressionId?: number,
  monographPublicationRequestId?: number | null,
) {
  const { authors, series, printing_information, ...rest } = manifestationCreateDoc;

  return {
    ...rest,
    cancelled: false,
    authors: JSON.stringify(authors),
    series: JSON.stringify(series),
    printing_information: JSON.stringify(printing_information),
    monograph_publication_expression_id: expressionId,
    monograph_publication_request_id: monographPublicationRequestId,
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
}

export async function changePublicationRequestPublisher(
  publicationRequest: MonographPublicationRequestSelect,
  newPublisherId: number | null,
  user: RequestUser,
) {
  const db = getKysely();

  // If request has been completed, deny changing publisher
  const { request_state } = publicationRequest;
  if (
    request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.ACCEPTED ||
    request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.REJECTED
  ) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot change publisher associated to request since the request has already been processed.',
    );
  }

  // Confirm any associated manifestations do not have identifier associated yet.
  const publication = await readMonographPublication(publicationRequest.monograph_publication_id);
  const hasIdentifier = publication.expressions.some((expression) => {
    const manifestationHasIdentifier = expression.manifestations.some(
      (manifestation) => manifestation.identifier !== null && manifestation.identifier.length > 0,
    );
    return manifestationHasIdentifier;
  });

  if (hasIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot change publisher for publication request due to identifiers have been already assigned for associated manifestation',
    );
  }

  // Confirm new publisher exists if defined
  if (newPublisherId !== null) {
    const publisherResult = await db
      .selectFrom('monograph_publisher')
      .select('id')
      .where('id', '=', newPublisherId)
      .executeTakeFirst();
    if (!publisherResult) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'Not found',
        `Could not find publisher id ${newPublisherId} from publisher registry`,
      );
    }
  }

  // Sanity check: request and publication owner should always be in sync
  // If this breaks, inform instead of allowing silently re-sync the value as there might be a larger data sync problem that needs to be investigated
  if (publicationRequest.monograph_publisher_id !== publication.monograph_publisher_id) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Out of sync error between publication request and publication has resulted into discarding the update: publicatino request has publisher id of ${publicationRequest.monograph_publisher_id} and publication has publisher id of ${publication.monograph_publisher_id}`,
    );
  }

  const updateDoc: {
    monograph_publisher_id: number | null;
    request_state?: string;
  } = {
    monograph_publisher_id: newPublisherId,
  };

  // Auto-update request state if need be
  if (publicationRequest.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.NEW) {
    updateDoc.request_state = MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS;
  }

  await db.transaction().execute(async (trx) => {
    // Change publisher for the request
    const updateResult = await trx
      .updateTable('monograph_publication_request')
      .set({
        ...updateDoc,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('id', '=', publicationRequest.id)
      .executeTakeFirstOrThrow();

    if (Number(updateResult.numUpdatedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }

    // Change publisher for the publication
    const publicationUpdateResult = await trx
      .updateTable('monograph_publication')
      .set({
        monograph_publisher_id: newPublisherId,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('id', '=', publicationRequest.monograph_publication_id)
      .executeTakeFirstOrThrow();

    if (Number(publicationUpdateResult.numUpdatedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }
  });

  return;
}
