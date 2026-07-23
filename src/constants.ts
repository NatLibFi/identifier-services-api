export const ENV = {
  PRODUCTION: 'PRODUCTION',
  STAGING: 'STAGING',
  DEVELOPMENT: 'DEVELOPMENT',
  TEST: 'TEST',
};

export const APPLICATION_ROLES = {
  ADMIN: 'admin',
  GUEST: 'guest',
  PUBLISHER: 'publisher',
};

export const APPLICATION_USER_UI_PUBLIC = 'UI-PUBLIC';
export const APPLICATION_UI_URL = 'https://tunnisteportaali.kansalliskirjasto.fi';

export const LANG_CODES = {
  'fi-FI': 'fi-FI',
  'sv-SE': 'sv-SE',
  'en-GB': 'en-GB',
};

export const MONOGRAPH_IDENTIFIERS = {
  ISBN: 'ISBN',
  ISMN: 'ISMN',
};

export const MONOGRAPH_PUBLICATION_REQUEST_STATES = {
  NEW: 'NEW',
  IN_PROCESS: 'IN_PROCESS',
  REJECTED: 'REJECTED',
  ACCEPTED: 'ACCEPTED',
};

export const MONOGRAPH_PUBLISHING_ACTIVITY = {
  CONTINUOUS: 'CONTINUOUS',
  OCCASIONAL: 'OCCASIONAL',
};

export const MONOGRAPH_EXPRESSION_TYPES = {
  BOOK: 'BOOK',
  DISSERTATION: 'DISSERTATION',
  SHEET_MUSIC: 'SHEET_MUSIC',
  MAP: 'MAP',
  OTHER: 'OTHER',
};

export const MONOGRAPH_MANIFESTATION_TYPES_PRINT = {
  PAPERBACK: 'PAPERBACK',
  HARDBACK: 'HARDBACK',
  SPIRAL_BINDING: 'SPIRAL_BINDING',
  OTHER_PRINT: 'OTHER_PRINT',
};

export const MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL = {
  PDF: 'PDF',
  EPUB: 'EPUB',
  CD_ROM: 'CD_ROM',
  MP3: 'MP3',
  OTHER: 'OTHER',
};

export const MONOGRAPH_MANIFESTATION_TYPES = {
  ...MONOGRAPH_MANIFESTATION_TYPES_PRINT,
  ...MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL,
  MULTIPART_MONOGRAPH: 'MULTIPART_MONOGRAPH',
};

export const MONOGRAPH_AUTHOR_ROLES = {
  AUTHOR: 'AUTHOR',
  TRANSLATOR: 'TRANSLATOR',
  ILLUSTRATOR: 'ILLUSTRATOR',
  EDITOR: 'EDITOR',
};

export const PUBLICATION_LANGUAGE = {
  FIN: 'FIN',
  SWE: 'SWE',
  ENG: 'ENG',
  SMI: 'SMI',
  SPA: 'SPA',
  FRE: 'FRE',
  GER: 'GER',
  RUS: 'RUS',
  MUL: 'MUL',
};

export const STRINGIFIED_EMPTY_ARRAY = JSON.stringify([]);

export const ISBN_IDENTIFIER_LENGTH = 13;
export const ISMN_IDENTIFIER_LENGTH = 13;

export const SYSTEM_USER = 'SYSTEM';

export const MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES = [
  '000',
  '015',
  '030',
  '035',
  '040',
  '045',
  '050',
  '055',
  '100',
  '120',
  '130',
  '200',
  '210',
  '211',
  '270',
  '300',
  '310',
  '315',
  '316',
  '320',
  '330',
  '340',
  '350',
  '370',
  '375',
  '380',
  '390',
  '400',
  '410',
  '420',
  '440',
  '450',
  '460',
  '470',
  '480',
  '490',
  '500',
  '510',
  '520',
  '530',
  '540',
  '550',
  '560',
  '570',
  '580',
  '590',
  '600',
  '610',
  '620',
  '621',
  '622',
  '630',
  '640',
  '650',
  '660',
  '670',
  '672',
  '680',
  '690',
  '700',
  '710',
  '720',
  '730',
  '740',
  '750',
  '760',
  '765',
  '770',
  '780',
  '790',
  '800',
  '810',
  '820',
  '830',
  '840',
  '850',
  '860',
  '870',
  '880',
  '890',
  '900',
  '910',
  '920',
  '930',
  '940',
  '950',
];

export const MONOGRAPH_MESSAGE_TYPES = {
  ISBN_ASSIGNMENT: 'ISBN_ASSIGNMENT',
  ISBN_LIST_DELIVERY: 'ISBN_LIST_DELIVERY',
  ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION: 'ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION',
  ISMN_ASSIGNMENT: 'ISMN_ASSIGNMENT',
  ISMN_LIST_DELIVERY: 'ISMN_LIST_DELIVERY',
  ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION: 'ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION',
  UNKNOWN: 'UNKNOWN',
};

// Note: considers Finnish ISBN publisher identifiers (e.g., 978-951-0 is category 1 publisher identifier and this category has always length of 9)
export const ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH: Record<string, number> = {
  '1': 9,
  '2': 10,
  '3': 11,
  '4': 12,
  '5': 13,
};

// Note: considers ISMN publisher identifiers (e.g., 979-0-100 is category 3 ISMN publisher identifier and this category has always length of 9)
export const ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH: Record<string, number> = {
  '3': 9,
  '4': 10,
  '5': 11,
  '6': 12,
  '7': 13,
};

export const MARC_RECORD_FORMAT = {
  MARC_RECORD_JS: 'MARC_RECORD_JS', // Note: only for internal interface usage
  JSON: 'JSON',
  TEXT: 'TEXT',
  ISO2709: 'ISO2709',
};

export const MARC_RECORD_FILTER = {
  PRINT_ONLY: 'PRINT_ONLY',
  ELECTRONICAL_ONLY: 'ELECTRONICAL_ONLY',
};

export const STATISTICS_FORMAT = {
  CSV: 'CSV',
  XLSX: 'XLSX',
};

export const MONOGRAPH_STATISTIC_TYPE = {
  MONTHLY: 'MONTHLY',
  PROGRESS_ISBN: 'PROGRESS_ISBN',
  PROGRESS_ISMN: 'PROGRESS_ISMN',
  PUBLISHERS_ISBN: 'PUBLISHERS_ISBN',
  PUBLISHERS_ISMN: 'PUBLISHERS_ISMN',
  PUBLISHERS_ISBN_UNIQUE: 'PUBLISHERS_ISBN_UNIQUE',
  PUBLISHERS_ISMN_UNIQUE: 'PUBLISHERS_ISMN_UNIQUE',
  PUBLICATIONS_ISBN: 'PUBLICATIONS_ISBN',
  PUBLICATIONS_ISMN: 'PUBLICATIONS_ISMN',
};
