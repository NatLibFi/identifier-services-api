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

import nodemailer from 'nodemailer';
import {convert} from 'html-to-text';

import {SMTP_CONFIG, MESSAGE_TYPE_CONFIG_ISBN, MESSAGE_TYPE_CONFIG_ISSN} from '../../../config';
import {ISSN_REGISTRY_PUBLICATION_MEDIUM, ISBN_REGISTRY_PUBLICATION_PRINT_TYPES, ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES} from '../../constants';

/**
 * Utility function for sending email using nodemailer library
 * @param {Object} messageOptions Message to send
 */
export async function sendEmail(messageOptions) {
  const {from, to, subject, html} = messageOptions;
  const text = convert(html);

  // Establish email connection
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // Verify server is ready to accept messages
  await transporter.verify();

  const nodemailerMessage = {
    from,
    to,
    subject,
    html,
    text
  };

  // Send message, main try/catch should catch errors occurring here
  await transporter.sendMail(nodemailerMessage);
}

/**
 * Utility function to verify validity of action for ISBN registry. Code is mapped to message type
 * which is mapped to message template. In order to load message template, this code is required.
 * @param {string} code Code of action used for loading message template linked to message type
 * @returns True if action is valid for loadtemplate operation, otherwise false
 */
export function isValidIsbnMessageCode(code) {
  return Object.keys(MESSAGE_TYPE_CONFIG_ISBN).includes(code);
}

/**
 * Utility function to verify validity of action for ISSN registry. Code is mapped to message type
 * which is mapped to message template. In order to load message template, this code is required.
 * @param {string} code Code of action used for loading message template linked to message type
 * @returns True if action is valid for loadtemplate operation, otherwise false
 */
export function isValidIssnMessageCode(code) {
  return Object.keys(MESSAGE_TYPE_CONFIG_ISSN).includes(code);
}

/**
 * Utility function to parse email address from publisher information. Use of first contact person's email
 * address is priorised over the defined common email address.
 * @param {Object} publisher ISSN registry publisher object
 * @returns Email address as string if one can be found, otherwise empty string
 */
export function getIssnPublisherEmail(publisher) {
  if (publisher.contactPerson?.name?.length > 0 && publisher.contactPerson?.email?.length > 0) {
    return publisher.contactPerson.email[0];
  }

  return publisher.emailCommon || '';
}

/**
 * Utility function used for translating ISSN-registry publication medium information.
 * @param {string} medium Medium information to translate
 * @param {string} langCode Language to translate to
 * @returns Translated string if translation is found, otherwise throws an Error
 */
export function translatePublicationMediumIssn(medium, langCode) {
  const translations = {
    'fi-FI': {
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.PRINTED]: 'painettu',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.ONLINE]: 'verkkojulkaisu',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.OTHER]: 'muu'
    },
    'sv-SE': {
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.PRINTED]: 'trycksak',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.ONLINE]: 'online-publikation',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.OTHER]: 'annan'
    },
    'en-GB': {
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.PRINTED]: 'printed',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.ONLINE]: 'online',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.CDROM]: 'CD-ROM',
      [ISSN_REGISTRY_PUBLICATION_MEDIUM.OTHER]: 'other'
    }
  };


  if (!Object.keys(translations).includes(langCode)) {
    throw new Error('Language code for translating email type could not be found');
  }

  if (!Object.keys(translations[langCode]).includes(medium)) {
    throw new Error('Identifier type translating email type could not be found');
  }

  return translations[langCode][medium];
}

/**
 * Utility function used for translating ISBN-registry publication type information.
 * @param {string} type Type information to translate
 * @param {string} langCode Language to translate to
 * @returns Translated string if translation is found, otherwise throws an Error
 */
export function translatePublicationTypeIsbn(type, langCode) {
  const translations = {
    'fi-FI': {
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.PAPERBACK]: 'pehmeäkantinen',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.HARDBACK]: 'kovakantinen',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.SPIRAL_BINDING]: 'kierreselkä',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.OTHER_PRINT]: 'muu',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.PDF]: 'PDF',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.EPUB]: 'EPUB',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.CD_ROM]: 'CD-ROM',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3]: 'MP3',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.OTHER]: 'muu'
    },
    'sv-SE': {
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.PAPERBACK]: 'mjuka pärmar',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.HARDBACK]: 'hårda pärmar',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.SPIRAL_BINDING]: 'spiralrygg',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.OTHER_PRINT]: 'annan',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.PDF]: 'PDF',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.EPUB]: 'EPUB',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.CD_ROM]: 'CD-ROM',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3]: 'MP3',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.OTHER]: 'annan'
    },
    'en-GB': {
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.PAPERBACK]: 'softcover',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.HARDBACK]: 'hardcover',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.SPIRAL_BINDING]: 'spiral-bound',
      [ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.OTHER_PRINT]: 'other',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.PDF]: 'PDF',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.EPUB]: 'EPUB',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.CD_ROM]: 'CD-ROM',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3]: 'MP3',
      [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.OTHER]: 'other'
    }
  };


  if (!Object.keys(translations).includes(langCode)) {
    throw new Error('Language code for translating email type could not be found');
  }

  if (!Object.keys(translations[langCode]).includes(type)) {
    throw new Error('Identifier type translating email type could not be found');
  }

  return translations[langCode][type];
}

/**
 * Utility function for prefixing email subject when emailing from test environment
 * @param {string} subject Message subject
 * @returns Test-prefixed message body
 */export function getTestPrefixedSubject(subject) {
  return `TESTI/TEST MESSAGE ${subject}`;
}

/**
 * Utility function for prefixing email body when emailing from test environment
 * @param {string} messageBody HTML message body
 * @returns {string} Test-prefixed message body
 */
export function getTestPrefixedMessageBody(messageBody) {
  return `Tämä viesti on testijärjestelmästä / This message is from test system.<br /><br />${messageBody}`;
}
