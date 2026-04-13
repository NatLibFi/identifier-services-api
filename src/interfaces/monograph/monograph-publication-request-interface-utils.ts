import { getCurrentTime } from '../interface-utils/common-interface-utils.ts';

import { APPLICATION_USER_UI_PUBLIC, MONOGRAPH_MANIFESTATION_TYPES } from '../../constants.ts';
import {
  monographExpressionAuthorRoleEnum,
  monographManifestationAuthorRoleEnum,
} from '../../validations/common-validation-enum.ts';

import type { CreateMonographPublicationRequestV1Http } from '../../validations/monograph/monograph-publication-request-validation.ts';
import type { MonographPrintingInformation } from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import type { RequestUser } from '../../generic-types.ts';

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

export function getDbPublicationRequestEntryV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
) {
  return {
    monograph_publisher_id: null,
    // monograph_publication_id is inserted within transaction
    official_name: monographPublicationRequestCreateDoc.officialName,
    publisher_identifier_str: monographPublicationRequestCreateDoc.publisherIdentifierStr ?? null,
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

export function getDbPublicationExpressionEntryV1(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
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

  return {
    // monograph_publication_id is inserted within transaction
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
    created: getCurrentTime(),
    created_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
    modified: getCurrentTime(),
    modified_by: user?.id ?? APPLICATION_USER_UI_PUBLIC,
  };
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

  const printingInformation =
    !!printingHouse || !!printingHouseCity
      ? [
          {
            printing_number: 1,
            printing_house: printingHouse ?? null,
            printing_house_city: printingHouseCity ?? null,
            copies: copies ?? null,
          },
        ]
      : [];

  const seriesInformation =
    !!series || !!issn
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
    // monograph_publication_expression_id is inserted within transaction
    // monograph_publication_request_id is inserted within transaction
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
