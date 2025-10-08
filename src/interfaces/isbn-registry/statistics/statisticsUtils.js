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

import HttpStatus from 'http-status';

import {ApiError} from '../../../utils';
import {AUTHOR_PUBLISHER_ID_ISBN} from '../../../config';
import {ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ISBN_REGISTRY_PUBLICATION_PRINT_TYPES} from '../../constants';

/**
 * Formats items so that statistics have required headers
 * @param {Object} publisher Publisher
 * @param {string} publisherIdentifier Publisher identifier
 * @param {string} identifierType Type of publisher identifier
 * @param {boolean} previousNamesOnly Whether entries should be generated from all previous names
 * @returns Formatted object or array of formatted objects if previousNamesOnly is set to true
 */
export function formatPublisherToPIID(publisher, publisherIdentifier, identifierType, previousNamesOnly = false) {
  // Using PIID headers as attribute values
  if (previousNamesOnly) {
    const previousNames = publisher.previous_names;
    // Attempt on generating entries from previous names. It may fail if previous names information does not
    // contain data in correct format.
    const previousNamesObject = JSON.parse(previousNames);
    if (typeof previousNamesObject !== 'object' || !Object.keys(previousNamesObject).includes('name') || !Array.isArray(previousNamesObject.name)) {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, `Could not generate previous names statistics for publisher identifier ${publisherIdentifier} as data is not in correct format`);
    }

    return previousNamesObject.name.map(previousName => _formatPublisher(previousName, true));
  }

  return _formatPublisher();

  // Note: uses publisher information from outer function scope. This is due to the use case where it is required to
  // overwrite name information for previous name entries.
  function _formatPublisher(overwriteName = false, isOtherName = false) {
    return {
      Registrant_Status_Code: publisher.has_quitted || isOtherName ? 'I' : 'A',
      Registrant_Prefix_Type: publisher.id === AUTHOR_PUBLISHER_ID_ISBN ? 'T' : 'P',
      [`Registrant_Prefix_Or_${identifierType}`]: String(publisherIdentifier),
      Registrant_Name: overwriteName ? String(overwriteName) : String(publisher.official_name),
      ISO_Country_Code: 'FI',
      Address_Line_1: String(publisher.address),
      Address_Line_2: `${publisher.zip} ${publisher.city}`,
      Address_Line_3: '',
      Address_Line_4: '',
      Admin_Contact_Name: publisher.contact_person,
      Admin_Phone: String(publisher.phone),
      Admin_Fax: '',
      Admin_Email: publisher.email,
      Alternate_Contact_Type: '',
      Alternate_Contact_Name: '',
      Alternate_Phone: '',
      Alternate_Fax: '',
      Alternate_Email: '',
      SAN: '',
      GLN: '',
      Website_URL: String(publisher.www),
      Registrant_ID: '',
      ISNI: ''
    };
  }
}

/**
 * Formats items so that statistics have required headers
 * @param {Object} publication Publication to format
 * @param {string} identifier Publication identifier
 * @param {string} publicationFormat Format of publicaton
 * @param {string} identifierType Type of identifier
 * @returns Formatted object
 */
export function formatPublicationToPIID(publication, identifier, publicationFormat, identifierType) {
  // Using PIID headers as attribute values
  const isCancelled = _publicationIsCanceled();

  return {
    Registrant_Status_Code: isCancelled ? 'I' : 'A',
    Registrant_Prefix_Type: 'A',
    [`Registrant_Prefix_Or_${identifierType}`]: String(identifier),
    Registrant_Name: String(publication.official_name),
    ISO_Country_Code: 'FI',
    Address_Line_1: String(publication.address),
    Address_Line_2: `${publication.zip} ${publication.city}`,
    Address_Line_3: '',
    Address_Line_4: '',
    Admin_Contact_Name: String(publication.contact_person),
    Admin_Phone: String(publication.phone),
    Admin_Fax: '',
    Admin_Email: String(publication.email),
    Alternate_Contact_Type: '',
    Alternate_Contact_Name: '',
    Alternate_Phone: '',
    Alternate_Fax: '',
    Alternate_Email: '',
    SAN: '',
    GLN: '',
    Website_URL: '',
    Registrant_ID: '',
    ISNI: ''
  };

  /**
   * Utility function to determine whether publication is cancelled or not.
   * @returns True if publication is cancelled, otherwise false
   */
  function _publicationIsCanceled() {
    // If publication name contains '(ISBN|ISMN) cancelled' but no format information, it means the publication has not been published at all, and all formats should have status I
    const publicationIsCanceled = publication.official_name.match(/^(?:ISBN|ISMN) cancelled/u);
    const cancellationIncludesTypeInfo = [...Object.values(ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ...Object.values(ISBN_REGISTRY_PUBLICATION_PRINT_TYPES))]
      .filter(v => publication.official_name.includes(v))
      .some(v => v);

    // If publication name contains format and cancellation information, it means that only the defined format is cancelled
    const typeIsCanceled = publication.official_name.match(/cancelled/u) && publication.official_name.includes(publicationFormat);

    return (publicationIsCanceled && !cancellationIncludesTypeInfo) || (cancellationIncludesTypeInfo && typeIsCanceled);
  }
}
