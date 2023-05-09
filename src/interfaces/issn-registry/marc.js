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

import Record from 'marc-record-js';
import {DateTime} from 'luxon';

import {ISSN_PUBLICATION_TYPES, ISSN_REGISTRY_PUBLICATION_MEDIUM} from '../constants';
import {NODE_ENV} from '../../config';

/**
 * Convert ISSN-registry publication entry to MARC record
 * @param {Object} rawInformation ISSN-registry publication, publisher and form objects to construct MARC from
 * @returns {Record} Record object constructed using marc-record-js library
 */
/* eslint-disable max-lines */
export function convertToMarcIssn({publication, publisher, form}) {
  /* eslint-disable functional/no-conditional-statements */
  const marcRecord = new Record();

  // Attributes affecting field generation
  const electronical = isElectronical(publication);

  // Set leader
  marcRecord.setLeader('00000nas a22000008i 4500');

  // Add control fields
  // 007 is generated only for electronical publications
  if (electronical) {
    marcRecord.insertControlField(['007', 'cr||||||||||||']);
  }

  // 008 added for all publications
  marcRecord.insertControlField(['008', generate008({publication, electronical})]);

  // Add datafields
  const dataFieldGenerators = [
    generate022,
    generate040,
    generate041,
    generate042,
    generate222,
    generate245,
    generate263,
    generate264a,
    generate264b,
    generate310,
    generate336,
    generate337,
    generate338,
    generate362,
    generateTestField,
    generate500,
    generate594,
    generate710,
    generate760,
    generate762,
    generate776,
    generate780,
    generate856,
    generate935,
    generateLOW
  ];

  // Generate datafields
  const generatorParams = {publication, publisher, form, electronical};

  const dataFields = dataFieldGenerators.map(dfg => dfg(generatorParams)).flat();

  // Add generated fields to record
  dataFields.forEach(df => marcRecord.appendField(df));

  return marcRecord;
  /* eslint-enable functional/no-conditional-statements */
}

function isElectronical(publication) {
  return publication.medium !== ISSN_REGISTRY_PUBLICATION_MEDIUM.PRINTED;
}

function generate008({publication, electronical}) {
  /* eslint-disable functional/no-let, functional/no-conditional-statements */
  const date = new Date();

  // Constructing field without immutability constraint
  // 0-5
  let field = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

  // 6
  field += 'c';

  // 7-10
  field += publication.issuedFromYear ? publication.issuedFromYear : '||||';

  // 11-14
  field += '9999';

  // 15-17
  field += 'fi ';

  // 18
  field += publication.frequency ? publication.frequency : ' ';

  // 19-20
  field += '| ';

  // 21
  field += getPublicationTypeInfo(publication);

  // 22
  field += '|';

  // 23 - publication format
  if (electronical) {
    field += 'o';
  } else {
    field += ' ';
  }

  // 24-34
  field += '     0|||b0';

  // 35-37
  field += publication.language ? publication.language.toLowerCase() : '|||';

  // 38-39
  field += '| ';

  return field;
  /* eslint-enable functional/no-let, functional/no-conditional-statements */

  function getPublicationTypeInfo(publication) {
    const mapToCharacterP = [
      ISSN_PUBLICATION_TYPES.STAFFMAGAZINE,
      ISSN_PUBLICATION_TYPES.MEMBERSHIPMAGAZINE,
      ISSN_PUBLICATION_TYPES.NEWSLETTER,
      ISSN_PUBLICATION_TYPES.JOURNAL,
      ISSN_PUBLICATION_TYPES.FREEPAPER
    ];

    if (mapToCharacterP.includes(publication.publicationType)) {
      return 'p';
    }

    if (publication.publicationType === ISSN_PUBLICATION_TYPES.NEWSPAPER) {
      return 'n';
    }

    if (publication.publicationType === ISSN_PUBLICATION_TYPES.MONOGRAPHY) {
      return 'm';
    }

    return '|';
  }
}

function generate022({publication}) {
  if (publication.issn) {
    return {tag: '022', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: publication.issn}, {code: '2', value: 'a'}]};
  }

  return [];
}

function generate040() {
  return {tag: '040', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'FI-NL'}, {code: 'b', value: 'fin'}, {code: 'e', value: 'rda'}]};
}

function generate041({publication}) {
  if (publication.language) {
    return {tag: '041', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: publication.language.toLowerCase()}]};
  }

  return [];
}

function generate042() {
  return {tag: '042', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'finb'}]};
}

function generate222({publication, electronical}) {
  if (!publication.title) {
    return [];
  }

  if (publication.medium === ISSN_REGISTRY_PUBLICATION_MEDIUM.OTHER) {
    return {tag: '222', ind1: ' ', ind2: '0', subfields: [{code: 'a', value: publication.title}]};
  }

  const subfieldB = electronical ? {code: 'b', value: '(Verkkoaineisto)'} : {code: 'b', value: '(Painettu)'};

  return {tag: '222', ind1: ' ', ind2: '0', subfields: [{code: 'a', value: publication.title}, subfieldB]};
}

function generate245({publication, publisher}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements,no-nested-ternary */
  if (!publication.title) {
    return [];
  }

  let subfieldAValue = publication.title;
  const subfieldBValue = publication.subtitle ? publisher.officialName ? `${publication.subtitle} /` : `${publication.subtitle}.` : undefined;
  const subfieldCValue = publisher.officialName ? `${publisher.officialName}.` : undefined;

  if (!publication.subtitle && !publisher.officialName) {
    subfieldAValue += '.';
  } else if (publication.subtitle) {
    subfieldAValue += ' :';
  } else if (publisher.officialName) {
    subfieldAValue += ' /';
  }

  return {tag: '245', ind1: '0', ind2: '0',
    subfields: [{code: 'a', value: subfieldAValue}, {code: 'b', value: subfieldBValue}, {code: 'c', value: subfieldCValue}].filter(v => v.value)};
  /* eslint-enable functional/no-let,functional/no-conditional-statements,no-nested-ternary */
}

function generate263({publication}) {
  if (publication.issuedFromYear) {
    return {tag: '263', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: `${publication.issuedFromYear}--`}]};
  }

  return [];
}

function generate264a({publication, publisher, form}) {
  if (!publisher.officialName || !publication.placeOfPublication || !publication.issuedFromYear) {
    return [];
  }

  const name = form.publisher ? form.publisher : publisher.officialName;
  const subfieldA = {code: 'a', value: `${publication.placeOfPublication} :`};
  const subfieldB = {code: 'b', value: `${name},`};
  const subfieldC = {code: 'c', value: `${publication.issuedFromYear}-`};

  return {tag: '264', ind1: ' ', ind2: '1', subfields: [subfieldA, subfieldB, subfieldC].filter(v => v)};
}

function generate264b({publication}) {
  if (publication.printer) {
    return {tag: '264', ind1: ' ', ind2: '3', subfields: [{code: 'b', value: publication.printer}]};
  }

  return [];
}

function generate310({publication}) {
  if (!publication.frequency) {
    return [];
  }

  const subfieldA = generateSubfieldA(publication);
  return subfieldA ? {tag: '310', ind1: ' ', ind2: ' ', subfields: [subfieldA]} : [];


  function generateSubfieldA(publication) {
    if (publication.frequency === 'z' && publication.frequencyOther) {
      return {code: 'a', value: publication.frequencyOther};
    }

    const translatedFrequency = translateFrequency(publication.frequency);
    return translatedFrequency ? {code: 'a', value: translatedFrequency} : null;
  }

  function translateFrequency(frequency) {
    const translationTable = {
      'a': 'Kerran vuodessa',
      'f': 'Kaksi kertaa vuodessa',
      'q': 'Neljä kertaa vuodessa',
      'b': 'Kuusi kertaa vuodessa',
      'm': 'Kerran kuukaudessa',
      'w': 'Kerran viikossa',
      'd': 'Päivittäin',
      'k': 'Päivitetään jatkuvasti',
      '#': 'Epäsäännöllinen',
      'z': 'Muu'
    };

    return Object.keys(translationTable).includes(frequency) ? translationTable[frequency] : null;
  }
}


function generate336() {
  return {tag: '336', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'teksti'}, {code: 'b', value: 'txt'}, {code: '2', value: 'rdacontent'}]};
}

function generate337({electronical}) {
  if (electronical) {
    return {tag: '337', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'tietokonekäyttöinen'}, {code: 'b', value: 'c'}, {code: '2', value: 'rdamedia'}]};
  }

  return {tag: '337', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'käytettävissä ilman laitetta'}, {code: 'b', value: 'n'}, {code: '2', value: 'rdamedia'}]};
}

function generate338({electronical}) {
  if (electronical) {
    return {tag: '338', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'verkkoaineisto'}, {code: 'b', value: 'cr'}, {code: '2', value: 'rdacarrier'}]};
  }

  return {tag: '338', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'nide'}, {code: 'b', value: 'nc'}, {code: '2', value: 'rdacarrier'}]};
}

function generate362({publication}) {
  if (publication.issuedFromNumber) {
    return {tag: '362', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: `${publication.issuedFromNumber}-`}]};
  }

  return [];
}

function generateTestField() {
  // For all other cases than production, generate a notification field that
  /* eslint-disable functional/no-conditional-statements,no-process-env */
  if (NODE_ENV !== 'production') {
    return [{tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'TUNNISTEREKISTERIN TESTITIETUE'}]}];
  }

  return [];
  /* eslint-enable functional/no-conditional-statements,no-process-env */
}

function generate500() {
  return {tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'ENNAKKOTIETO / KANSALLISKIRJASTO.'}]};
}

function generate594() {
  return {tag: '594', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'ENNAKKOTIETO / KANSALLISKIRJASTO.'}, {code: '5', value: 'FENNI'}]};
}

function generate710({publisher, form}) {
  const name = form.publisher ? form.publisher : publisher.officialName;
  if (name) {
    return {tag: '710', ind1: '2', ind2: ' ', subfields: [{code: 'a', value: `${name}.`}]};
  }

  return [];
}

function generate760({publication}) {
  return getTitleAndIssnFromJson(publication.mainSeries)
    .map(series => generateField(series))
    .filter(field => field); // Removes undefined values


  function generateField(series) {
    if (!series.title) {
      return undefined;
    }

    if (!series.issn) {
      return {tag: '760', ind1: '0', ind2: ' ', subfields: [{code: 't', value: series.title}, {code: '9', value: 'FENNI<KEEP>'}]};
    }

    return {tag: '760', ind1: '0', ind2: ' ', subfields: [{code: 't', value: series.title}, {code: 'x', value: series.issn}, {code: '9', value: 'FENNI<KEEP>'}]};
  }
}

function generate762({publication}) {
  return getTitleAndIssnFromJson(publication.subseries)
    .map(series => generateField(series))
    .filter(field => field); // Removes undefined values


  function generateField(series) {
    if (!series.title) {
      return undefined;
    }

    if (!series.issn) {
      return {tag: '762', ind1: '0', ind2: ' ', subfields: [{code: 't', value: series.title}, {code: '9', value: 'FENNI<KEEP>'}]};
    }

    return {tag: '762', ind1: '0', ind2: ' ', subfields: [{code: 't', value: series.title}, {code: 'x', value: series.issn}, {code: '9', value: 'FENNI<KEEP>'}]};
  }
}

function generate776({publication, electronical}) {
  return getTitleAndIssnFromJson(publication.anotherMedium)
    .map(series => generateField(series, electronical))
    .filter(field => field); // Removes undefined values


  function generateField(series, electronical) {
    if (!series.title) {
      return undefined;
    }

    const subfieldI = electronical ? 'Painettu: ' : 'Verkkoaineisto: ';

    if (!series.issn) {
      return {tag: '776', ind1: '0', ind2: '8', subfields: [{code: 'i', value: subfieldI}, {code: 't', value: series.title}, {code: '9', value: 'FENNI<KEEP>'}]};
    }

    return {tag: '776', ind1: '0', ind2: '8',
      subfields: [{code: 'i', value: subfieldI}, {code: 't', value: series.title}, {code: 'x', value: series.issn}, {code: '9', value: 'FENNI<KEEP>'}]};
  }
}

function generate780({publication}) {
  return getTitleAndIssnFromJson(publication.previous)
    .map(series => generateField(series))
    .filter(field => field); // Removes undefined values


  function generateField(series) {
    if (!series.title) {
      return undefined;
    }

    if (!series.issn) {
      return {tag: '780', ind1: '0', ind2: '0', subfields: [{code: 't', value: series.title}, {code: '9', value: 'FENNI<KEEP>'}]};
    }

    return {tag: '780', ind1: '0', ind2: '0',
      subfields: [{code: 't', value: series.title}, {code: 'x', value: series.issn}, {code: '9', value: 'FENNI<KEEP>'}]};
  }
}

function generate856({publication, electronical}) {
  if (electronical && publication.url) {
    return {tag: '856', ind1: '4', ind2: '0', subfields: [{code: 'u', value: publication.url}, {code: 'y', value: 'Linkki verkkoaineistoon'}]};
  }

  return [];
}

function generate935() {
  const date = new Date();
  const luxonDate = DateTime.fromJSDate(date); // Using Luxon for date formatting purposes: two-digit year and week number are required

  const dateDefinition = luxonDate.toFormat('WWyy');
  return {tag: '935', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: `ISSNpre${dateDefinition}`}, {code: '5', value: 'FENNI'}]};
}

function getTitleAndIssnFromJson(v) {
  // Title and issn attributes are required and they need to be array
  if (!v || !v.title || !v.issn || !Array.isArray(v.title) || !Array.isArray(v.issn)) {
    return [];
  }

  // Return array of values that can be gathered through looping the paired properties
  return [...Array(v.title.length).keys()].map(idx => {
    const result = {};

    /* eslint-disable functional/immutable-data,functional/no-conditional-statements */
    if (v.title.length - 1 >= idx) {
      result.title = v.title[idx];
    }

    if (v.issn.length - 1 >= idx) {
      result.issn = v.issn[idx];
    }
    /* eslint-enable functional/immutable-data,functional/no-conditional-statements */

    return Object.keys.length > 0 ? result : undefined;
  });
}

function generateLOW() {
  return {tag: 'LOW', ind1: '', ind2: '', subfields: [{code: 'a', value: 'FIKKA'}]};
}
