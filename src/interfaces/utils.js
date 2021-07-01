/* eslint-disable max-lines */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-statements, max-lines */
/* eslint-disable no-param-reassign */
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Identifier Services
 *
 * Copyright (C) 2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

import {ApiError, Utils, createApiClient} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
import fs from 'fs';
import jose from 'jose';
import CrowdClient from 'atlassian-crowd-client';
const Ajv = require('ajv');
const {readFileSync} = require('fs');
const path = require('path');

import {formatUrl} from '../utils';
import {
  UI_URL,
  SMTP_URL,
  API_URL,
  API_USERNAME,
  API_PASSWORD,
  API_CLIENT_USER_AGENT,
  CROWD_URL,
  CROWD_APP_NAME,
  CROWD_APP_PASSWORD
} from '../config';

const {sendEmail} = Utils;

const crowdClient = new CrowdClient({
  baseUrl: CROWD_URL,
  application: {
    name: CROWD_APP_NAME,
    password: CROWD_APP_PASSWORD
  }
});

const localClient = createApiClient({
  url: API_URL, username: API_USERNAME, password: API_PASSWORD,
  userAgent: API_CLIENT_USER_AGENT
});

const permissions = {
  users: {
    create: [
      'system',
      'admin'
    ],
    read: [
      'system',
      'admin',
      'publisher'
    ],
    update: [
      'system',
      'admin',
      'publisher'
    ],
    remove: [
      'system',
      'admin'
    ],
    changePwd: [
      'system',
      'admin'
    ],
    query: [
      'system',
      'admin',
      'publisher'
    ]
  },
  userRequests: {
    createRequest: ['publisher'],
    readRequest: [
      'system',
      'admin',
      'publisher'
    ],
    updateRequest: [
      'system',
      'admin'
    ],
    removeRequest: ['system'],
    queryRequest: [
      'system',
      'admin',
      'publisher'
    ]
  },
  publishers: {
    create: [
      'admin',
      'system'
    ],
    read: ['all'],
    update: ['publisher'],
    query: ['all']
  },
  publisherRequests: {
    createRequest: ['all'],
    readRequest: [
      'system',
      'admin'
    ],
    updateRequest: [
      'system',
      'admin'
    ],
    removeRequest: ['system'],
    queryRequests: [
      'system',
      'admin'
    ]
  },
  publicationIsbnIsmn: {
    createIsbnIsmn: [
      'admin',
      'system',
      'publisher'
    ],
    readIsbnIsmn: [
      'admin',
      'publisher'
    ],
    updateIsbnIsmn: [
      'system',
      'admin'
    ],
    queryIsbnIsmn: [
      'system',
      'admin',
      'publisher'
    ]
  },
  publicationIsbnIsmnRequests: {
    createRequestIsbnIsmn: ['all'],
    readRequestIsbnIsmn: [
      'system',
      'admin',
      'publisher'
    ],
    updateRequestIsbnIsmn: [
      'system',
      'admin'
    ],
    removeRequestIsbnIsmn: ['system'],
    queryRequestIsbnIsmn: [
      'system',
      'admin',
      'publisher'
    ]
  },
  publicationIssn: {
    createISSN: [
      'admin',
      'system',
      'publisher'
    ],
    readISSN: [
      'admin',
      'publisher'
    ],
    updateISSN: [
      'system',
      'admin'
    ],
    queryISSN: [
      'system',
      'admin',
      'publisher'
    ]
  },
  publicationIssnRequests: {
    createRequestISSN: ['all'],
    readRequestISSN: [
      'system',
      'admin',
      'publisher'
    ],
    updateRequestISSN: [
      'system',
      'admin'
    ],
    removeRequestISSN: ['system'],
    queryRequestISSN: [
      'system',
      'admin',
      'publisher'
    ]
  },
  message: {
    create: ['admin'],
    read: [
      'admin',
      'system'
    ],
    query: [
      'system',
      'admin'
    ],
    queryAll: [
      'system',
      'admin'
    ]
  },
  messageTemplates: {
    create: ['admin'],
    read: [
      'admin',
      'system'
    ],
    update: [
      'system',
      'admin'
    ],
    remove: ['admin'],
    query: [
      'system',
      'admin'
    ],
    queryAll: [
      'system',
      'admin'
    ]
  },
  marc: {
    read: [
      'admin',
      'system'
    ]
  },
  ranges: {
    queryRanges: [
      'admin',
      'system'
    ],
    readRange: [
      'admin',
      'system'
    ],
    updateRange: [
      'admin',
      'system'
    ],
    querySubRanges: [
      'admin',
      'system',
      'publisher'
    ],
    readSubRange: [
      'admin',
      'system'
    ],
    createSubRange: [
      'admin',
      'system'
    ],
    revokeIsbnSubRange: [
      'admin',
      'system'
    ],
    revokeIsmnSubRange: [
      'admin',
      'system'
    ],
    revokeIdentifier: [
      'admin',
      'system'
    ],
    queryRangesIsbnBatch: [
      'admin',
      'system',
      'publisher'
    ],
    readRangeBatch: [
      'admin',
      'system',
      'publisher'
    ],
    createRangesIsbnBatch: [
      'admin',
      'system'
    ],
    readRangesIdentifier: [
      'admin',
      'system'
    ],
    queryRangesIdentifier: [
      'admin',
      'system',
      'publisher'
    ],
    queryRangesIsmnBatch: [
      'admin',
      'system'
    ],
    createRangesIsmnBatch: [
      'admin',
      'system'
    ],
    createIsbn: [
      'admin',
      'system'
    ],
    readIsbn: [
      'admin',
      'system'
    ],
    updateIsbn: [
      'admin',
      'system'
    ],
    queryIsbn: [
      'admin',
      'system'
    ],
    createIsmn: [
      'admin',
      'system'
    ],
    readIsmn: [
      'admin',
      'system'
    ],
    updateIsmn: [
      'admin',
      'system'
    ],
    queryIsmn: [
      'admin',
      'system'
    ],
    createIssn: [
      'admin',
      'system'
    ],
    readIssn: [
      'admin',
      'system'
    ],
    updateIssn: [
      'admin',
      'system'
    ],
    queryIssn: [
      'admin',
      'system'
    ],
    assignIssnRange: [
      'admin',
      'system'
    ]
  }
};

export function hasPermission(user, type, command) {
  const commandPermissions = permissions[type][command];
  const permitted = commandPermissions.includes('all') || commandPermissions.some(role => user.role === role);
  return permitted;
}

export function convertLanguage(language) {
  const lang = language === 'sv' ? 'swe' : 'eng';
  return language === 'fi' ? 'fin' : lang;
}

export function filterResult(result) {
  return filterDoc(result);

  function filterDoc(doc) {
    return Object.entries(doc)
      .filter(filter)
      .reduce((acc, [
        key,
        value
      ]) => ({...acc, [key]: value}), {});

    function filter([key]) {
      const allowedKeys = [
        'state',
        'publisher',
        'lastUpdated'
      ];
      return allowedKeys.includes(key) === false;
    }
  }
}

export async function createLinkAndSendEmail({request, PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS}) {
  const {JWK, JWE} = jose;
  const key = JWK.asKey(fs.readFileSync(PRIVATE_KEY_URL));
  if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
    const response = await crowdClient.user.get(request.id);
    if (response) {
      const payload = jose.JWT.sign(request, key, {
        expiresIn: '24 hours',
        iat: true
      });
      const token = await JWE.encrypt(payload, key, {kid: key.kid});
      const link = `${UI_URL}/users/passwordReset/${token}`;
      const result = sendEmail({
        name: 'forgot password',
        args: {link},
        getTemplate,

        SMTP_URL,
        API_EMAIL: request.email
      });
      return result;
    }
  }

  const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
  const passportLocalList = JSON.parse(readResponse);
  const passportArray = passportLocalList.map(item => item.id);
  passportLocalList.forEach(async passport => {
    if (passportArray.includes(request.id)) {
      if (passport.id === request.id) { // eslint-disable-line functional/no-conditional-statement
        const result = await setPayloadTokenNLink();
        return result;
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    function setPayloadTokenNLink() {
      const payload = jose.JWT.sign(request, key, {
        expiresIn: '24 hours',
        iat: true
      });
      const token = JWE.encrypt(payload, key, {kid: key.kid});
      const link = `${UI_URL}/users/passwordReset/${token}`;
      return sendEmail({
        name: 'forgot password',
        args: {link},
        getTemplate,
        SMTP_URL,
        API_EMAIL: request.email
      });
    }
  });
}

export async function getTemplate(query, cache) {
  const key = JSON.stringify(query);
  if (key in cache) {
    return cache[key];
  }
  return {...cache, [key]: await localClient.templates.getTemplate(query)};
}

export function validateDoc(doc, schemaName) {
  const validate = getValidator(schemaName);
  if (validate(doc)) {
    return validate;
  }
  throw new Error(JSON.stringify(validate.errors, undefined, 2));
}

function getValidator(schemaName) {
  const str = readFileSync(path.join(__dirname, '..', 'api.json'), 'utf8')
    .replace(/#\/components\/schemas/gmu, 'defs#/definitions');
  const obj = JSON.parse(str);

  return new Ajv({allErrors: true})
    .addSchema({
      $id: 'defs',
      definitions: obj.components.schemas
    })
    .compile(obj.components.schemas[schemaName]);
}

export function validateRange(rangeList, doc) {
  const rangeEnds = rangeList.results.map(item => item.rangeEnd);
  const arrBool = rangeEnds.every(item => Number(doc.rangeStart) > Number(item));
  if (arrBool === false || Number(doc.rangeEnd) < Number(doc.rangeStart)) { // eslint-disable-line functional/no-conditional-statement
    throw new ApiError(HttpStatus.CONFLICT);
  }
  return true;
}

export function formatPayloadCreateIsbn(doc) {
  const {category, prefix, langGroup, rangeStart, rangeEnd} = doc;
  const maxlength = Number(category);
  const baseObj = {
    prefix,
    langGroup,
    category,
    rangeStart,
    rangeEnd,
    free: (Number(rangeEnd) - Number(rangeStart)).toString(),
    next: rangeStart,
    taken: '0',
    canceled: '0',
    active: true,
    isClosed: false
  };

  if (rangeStart.length > maxlength || rangeEnd.length > maxlength) { // eslint-disable-line functional/no-conditional-statement
    throw new ApiError(HttpStatus.BAD_REQUEST);
  }

  return baseObj;
}

export function formatPayloadCreateIsmn(doc) {
  const {category, prefix, rangeStart, rangeEnd} = doc;
  const maxlength = Number(category);
  const baseObj = {
    prefix,
    category,
    rangeStart,
    rangeEnd,
    free: (Number(rangeEnd) - Number(rangeStart)).toString(),
    next: rangeStart,
    taken: '0',
    canceled: '0',
    active: true,
    isClosed: false
  };

  if (rangeStart.length > maxlength || rangeEnd.length > maxlength) { // eslint-disable-line functional/no-conditional-statement
    throw new ApiError(HttpStatus.BAD_REQUEST);
  }

  return baseObj;
}

export function calculatePublisherIdentifier({payload, prefix, langGroup, next, category}) {
  if (langGroup) { // eslint-disable-line functional/no-conditional-statement
    switch (category) {
    case '1':
      return {
        ...payload,
        publisherIdentifier: `${prefix}-${langGroup}-${next}`,
        rangeStart: '00000',
        rangeEnd: '99999',
        free: '100000',
        next: '00000'
      };
    case '2':
      return {
        ...payload,
        publisherIdentifier: `${prefix}-${langGroup}-${next}`,
        rangeStart: '0000',
        rangeEnd: '9999',
        free: '10000',
        next: '0000'
      };
    case '3':
      return {
        ...payload,
        publisherIdentifier: `${prefix}-${langGroup}-${next}`,
        rangeStart: '000',
        rangeEnd: '999',
        free: '1000',
        next: '000'
      };
    case '4':
      return {
        ...payload,
        publisherIdentifier: `${prefix}-${langGroup}-${next}`,
        rangeStart: '00',
        rangeEnd: '99',
        free: '100',
        next: '00'
      };
    case '5':
      return {
        ...payload,
        publisherIdentifier: `${prefix}-${langGroup}-${next}`,
        rangeStart: '0',
        rangeEnd: '9',
        free: '10',
        next: '0'
      };
    default:
      return null;
    }
  }

  switch (category) {
  case '3':
    return {
      ...payload,
      publisherIdentifier: `${prefix}-${next}`,
      rangeStart: '00000',
      rangeEnd: '99999',
      free: '100000',
      next: '00000'
    };
  case '5':
    return {
      ...payload,
      publisherIdentifier: `${prefix}-${next}`,
      rangeStart: '000',
      rangeEnd: '999',
      free: '1000',
      next: '000'
    };
  case '6':
    return {
      ...payload,
      publisherIdentifier: `${prefix}-${next}`,
      rangeStart: '00',
      rangeEnd: '99',
      free: '100',
      next: '00'
    };
  case '7':
    return {
      ...payload,
      publisherIdentifier: `${prefix}-${next}`,
      rangeStart: '0',
      rangeEnd: '9',
      free: '10',
      next: '0'
    };
  default: {
    return null;
  }
  }

}

export function manageFormatDetails(formatDetails) {
  const {fileFormat, printFormat, otherFileFormat, otherPrintFormat} = formatDetails;
  const allFormats = fileFormat && printFormat
    ? [
      ...fileFormat.format,
      ...printFormat.format
    ]
    : fileFormat
      ? [...fileFormat.format]
      : printFormat
        ? [...printFormat.format]
        : [];
  otherFileFormat && otherPrintFormat // eslint-disable-line no-unused-expressions
    ? [
      ...Object.values(otherFileFormat),
      ...Object.values(otherPrintFormat)
    ].forEach(v => allFormats.push(v)) // eslint-disable-line functional/immutable-data
    : otherFileFormat
      ? Object.values(otherFileFormat).forEach(v => allFormats.push(v)) // eslint-disable-line functional/immutable-data
      : otherPrintFormat && Object.values(otherPrintFormat).forEach(v => allFormats.push(v)); // eslint-disable-line functional/immutable-data
  return allFormats;
}

export function calculatePublicationIdentifier(nextValue, category, index, publicationType) {
  if (publicationType === 'isbn') {
    return isbnPublicationIdentifier();
  }

  if (publicationType === 'ismn') {
    return ismnPublicationIdentifier();
  }

  function isbnPublicationIdentifier() {
    const prefix = nextValue.slice(0, 3);
    const langGroup = nextValue.slice(4, 7);
    const range = nextValue.slice(8, 8 + Number(category));
    const next = getNext(nextValue, category, index);
    const combineArray = nextValue.split('').filter(i => i !== '-');

    const mode = 10;
    const sum = combineArray.reduce((acc, char, i) => {
      if (i % 2 === 0) { // eslint-disable-line functional/no-conditional-statement
        acc += Number(char) * 1;
      } else { // eslint-disable-line functional/no-conditional-statement
        acc += Number(char) * 3;
      }
      return acc;
    }, 0);

    const remainder = sum % mode;
    const checkdigit = mode - remainder === 10 ? 0 : mode - remainder;
    return `${prefix}-${langGroup}-${range}-${next}-${checkdigit}`;
  }

  function getNext(nextValue, category, index) {
    const next = nextValue.slice(8 + Number(category) + 1);
    const newNextvalue = Number(nextValue.slice(8 + Number(category) + 1)) + Number(index);
    const difference = next.length - newNextvalue.toString().length;
    switch (difference) {
    case 4:
      return `0000${newNextvalue}`;
    case 3:
      return `000${newNextvalue}`;
    case 2:
      return `00${newNextvalue}`;
    case 1:
      return `0${newNextvalue}`;
    default:
      return `${newNextvalue}`;
    }
  }

  function ismnPublicationIdentifier() {
    const prefix = nextValue.slice(0, 5);
    const publisherCode = calcPublisherCode(nextValue, category);
    const nextPublicationCode = calcPublicationCode(nextValue, category);
    const combineArray = `${prefix.replace(/-/ug, '')}${publisherCode}${nextPublicationCode}`.split('');
    const mode = 10;
    const sum = combineArray.reduce((acc, char, i) => {
      if (i % 2 === 0) { // eslint-disable-line functional/no-conditional-statement
        acc += Number(char) * 1;
      } else { // eslint-disable-line functional/no-conditional-statement
        acc += Number(char) * 3;
      }
      return acc;
    }, 0);

    const remainder = sum % mode;
    const checkdigit = mode - remainder;

    return `${prefix}-${publisherCode}-${nextPublicationCode}-${checkdigit}`;

  }

  function calcPublisherCode(n, c) {
    switch (c) {
    case '3':
      return n.slice(6, 9);
    case '5':
      return n.slice(6, 11);
    case '6':
      return n.slice(6, 12);
    case '7':
      return n.slice(6, 13);
    default:
      return n.slice(6, 9);
    }
  }

  function calcPublicationCode(n, c) {
    switch (c) {
    case '3':
      return nextVal(n, 10);
    case '5':
      return nextVal(n, 12);
    case '6':
      return nextVal(n, 13);
    case '7':
      return nextVal(n, 14);
    default:
      return nextVal(n, 10);
    }

    function nextVal(n, l) {
      const nSliced = `1${n.slice(l)}`;
      const nNumber = Number(`${Number(nSliced) + index}`);
      return nNumber.toString().slice(1);
    }
  }

}

export function updateNext(prevNext, count) {
  const {length} = prevNext;
  let sum; // eslint-disable-line functional/no-let
  sum = `${Number(prevNext) + count}`;
  for (let x = 0; sum.length < length; x++) { // eslint-disable-line functional/no-loop-statement, no-plusplus, functional/no-let
    sum = `0${sum}`;
  }
  return sum;
}
