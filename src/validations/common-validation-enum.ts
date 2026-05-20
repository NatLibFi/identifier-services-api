import {
  LANG_CODES,
  MONOGRAPH_AUTHOR_ROLES,
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_IDENTIFIERS,
  MONOGRAPH_MANIFESTATION_TYPES,
  MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL,
  MONOGRAPH_MANIFESTATION_TYPES_PRINT,
  MONOGRAPH_PUBLICATION_REQUEST_STATES,
  MONOGRAPH_PUBLISHING_ACTIVITY,
  PUBLICATION_LANGUAGE,
} from '../constants.ts';

export const langCodeEnum = Object.values(LANG_CODES);

export const monographIdentifierEnum = Object.values(MONOGRAPH_IDENTIFIERS);

export const monographPublicationRequestStateEnum = Object.values(MONOGRAPH_PUBLICATION_REQUEST_STATES);
export const monographPublishingActivityEnum = Object.values(MONOGRAPH_PUBLISHING_ACTIVITY);

export const monographExpressionTypeEnum = Object.values(MONOGRAPH_EXPRESSION_TYPES);

export const monographManifestationTypeEnum = Object.values(MONOGRAPH_MANIFESTATION_TYPES);
export const monographManifestationTypePrintEnum = Object.values(MONOGRAPH_MANIFESTATION_TYPES_PRINT);
export const monographManifestationTypeElectronicalEnum = Object.values(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL);

export const monographAuthorRoleEnum = Object.values(MONOGRAPH_AUTHOR_ROLES);

export const publicationLanguageEnum = Object.values(PUBLICATION_LANGUAGE);
