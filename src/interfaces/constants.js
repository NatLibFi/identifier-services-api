/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API service of Identifier Services system
 *
 * Copyright (C) 2023 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

/* Based on original work by Petteri Kivimäki https://github.com/petkivim/ (Identifier Registry) */

// THESE CONSTANTS SHOULD NOT BE EDITED!

// SHARED CONSTANTS
export const COMMON_REGISTRY_TYPES = {
  ISBN_ISMN: 'ISBN_ISMN',
  ISSN: 'ISSN'
};

export const COMMON_IDENTIFIER_TYPES = {
  ISBN: 'ISBN',
  ISMN: 'ISMN',
  ISSN: 'ISSN'
};

export const COMMON_LANGUAGES = {
  finnish: 'fi-FI',
  swedish: 'sv-SE',
  english: 'en-GB'
};

// ISBN-REGISTRY CONSTANTS
export const ISBN_REGISTRY_ISBN_RANGE_LENGTH = 6;
export const ISBN_REGISTRY_ISMN_RANGE_LENGTH = 8;

export const ISBN_REGISTRY_FORMATS = {
  PRINT: 'PRINT',
  ELECTRONICAL: 'ELECTRONICAL',
  PRINT_ELECTRONICAL: 'PRINT_ELECTRONICAL'
};

export const ISBN_REGISTRY_PUBLICATION_TYPES = {
  BOOK: 'BOOK',
  DISSERTATION: 'DISSERTATION',
  MAP: 'MAP',
  SHEET_MUSIC: 'SHEET_MUSIC',
  OTHER: 'OTHER'
};

export const ISBN_REGISTRY_PUBLICATION_PRINT_TYPES = {
  PAPERBACK: 'PAPERBACK',
  HARDBACK: 'HARDBACK',
  SPIRAL_BINDING: 'SPIRAL_BINDING',
  OTHER_PRINT: 'OTHER_PRINT'
};
export const ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES = {
  PDF: 'PDF',
  EPUB: 'EPUB',
  CD_ROM: 'CD_ROM',
  MP3: 'MP3',
  OTHER: 'OTHER'
};

// ISSN REGISTRY CONSTANTS
export const ISSN_REGISTRY_FORM_STATUS = {
  NOT_HANDLED: 'NOT_HANDLED',
  NOT_NOTIFIED: 'NOT_NOTIFIED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

export const ISSN_REGISTRY_PUBLICATION_STATUS = {
  NO_ISSN_GRANTED: 'NO_ISSN_GRANTED',
  NO_PREPUBLICATION_RECORD: 'NO_PREPUBLICATION_RECORD',
  ISSN_FROZEN: 'ISSN_FROZEN',
  WAITING_FOR_CONTROL_COPY: 'WAITING_FOR_CONTROL_COPY',
  COMPLETED: 'COMPLETED'
};

export const ISSN_REGISTRY_PUBLICATION_MEDIUM = {
  PRINTED: 'PRINTED',
  ONLINE: 'ONLINE',
  CDROM: 'CDROM',
  OTHER: 'OTHER'
};

export const ISSN_PUBLICATION_TYPES = {
  JOURNAL: 'JOURNAL',
  NEWSLETTER: 'NEWSLETTER',
  STAFFMAGAZINE: 'STAFF_MAGAZINE',
  MEMBERSHIPMAGAZINE: 'MEMBERSHIP_BASED_MAGAZINE',
  NEWSPAPER: 'NEWSPAPER',
  FREEPAPER: 'FREE_PAPER',
  MONOGRAPHY: 'MONOGRAPHY_SERIES',
  CARTOON: 'CARTOON',
  OTHER: 'OTHER_SERIAL'
};
