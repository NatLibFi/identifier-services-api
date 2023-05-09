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

/* Based on original work by Petteri Kivimäki (Identifier Registry) */

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
  /* eslint-disable camelcase */
  // Using PIID headers as attribute values
  if (previousNamesOnly) {
    return publisher.previousNames.map(previousName => _formatPublisher(previousName, true));
  }

  return _formatPublisher();

  function _formatPublisher(overwriteName = false, isOtherName = false) {
    return {
      Registrant_Status_Code: publisher.hasQuitted || isOtherName ? 'I' : 'A',
      Registrant_Prefix_Type: publisher.id === AUTHOR_PUBLISHER_ID_ISBN ? 'T' : 'P',
      [`Registrant_Prefix_Or_${identifierType}`]: publisherIdentifier,
      Registrant_Name: overwriteName ? overwriteName : publisher.officialName,
      ISO_Country_Code: 'FI',
      Address_Line_1: publisher.address,
      Address_Line_2: `${publisher.zip} ${publisher.city}`,
      Address_Line_3: '',
      Address_Line_4: '',
      Admin_Contact_Name: publisher.contactPerson,
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
      Website_URL: publisher.www,
      Registrant_ID: '',
      ISNI: ''
    };
  }

  /* eslint-enable camelcase */
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
  /* eslint-disable camelcase */
  // Using PIID headers as attribute values
  const isCancelled = _publicationIsCanceled();

  return {
    Registrant_Status_Code: isCancelled ? 'I' : 'A',
    Registrant_Prefix_Type: 'A',
    [`Registrant_Prefix_Or_${identifierType}`]: String(identifier),
    Registrant_Name: publication.officialName,
    ISO_Country_Code: 'FI',
    Address_Line_1: publication.address,
    Address_Line_2: `${publication.zip} ${publication.city}`,
    Address_Line_3: '',
    Address_Line_4: '',
    Admin_Contact_Name: publication.contactPerson,
    Admin_Phone: String(publication.phone),
    Admin_Fax: '',
    Admin_Email: publication.email,
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
  /* eslint-enable camelcase */

  /**
   * Utility function to determine whether publication is cancelled or not.
   * @returns True if publication is cancelled, otherwise false
   */
  function _publicationIsCanceled() {
    // If publication name contains '(ISBN|ISMN) cancelled' but no format information, it means the publication has not been published at all, and all formats should have status I
    const publicationIsCanceled = publication.officialName.match(/^(?:ISBN|ISMN) cancelled/u);
    const cancellationIncludesTypeInfo = [...Object.values(ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ...Object.values(ISBN_REGISTRY_PUBLICATION_PRINT_TYPES))]
      .filter(v => publication.officialName.includes(v))
      .some(v => v);

    // If publication name contains format and cancellation information, it means that only the defined format is cancelled
    const typeIsCanceled = publication.officialName.match(/cancelled/u) && publication.officialName.includes(publicationFormat);

    return (publicationIsCanceled && !cancellationIncludesTypeInfo) || (cancellationIncludesTypeInfo && typeIsCanceled); // eslint-disable-line no-extra-parens
  }
}
