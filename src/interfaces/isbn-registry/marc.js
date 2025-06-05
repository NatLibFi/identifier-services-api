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

import {MarcRecord} from '@natlibfi/marc-record';
import {NODE_ENV} from '../../config';

import {ISBN_REGISTRY_FORMATS, ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ISBN_REGISTRY_PUBLICATION_PRINT_TYPES, ISBN_REGISTRY_PUBLICATION_TYPES} from '../constants';

/**
 * Convert ISBN-registry publication entry to MARC record
 * @param {Object} publication ISBN-registry publication
 * @param {string} electronicalRecordPublicationType Publication type to produce MARC record for if publication considers of electronical type
 * @returns {Object} Record object constructed using marc-record-js library
 */
/* eslint-disable max-lines,max-statements */
export function convertToMarcIsbnIsmn(publication, electronicalRecordPublicationType = null) {
  /* eslint-disable functional/no-conditional-statements */
  const marcRecord = new MarcRecord();

  const electronical = isElectronical(electronicalRecordPublicationType);
  const sheetmusic = isSheetMusic(publication);
  const dissertation = isDissertation(publication);
  const map = isMap(publication);
  const audiobook = isAudiobook(electronicalRecordPublicationType);

  // Set leader, is different for sheetmusic
  if (sheetmusic) {
    // eslint-disable-next-line functional/immutable-data
    marcRecord.leader = '00000ncm a22000008i 4500';
  } else {
    // eslint-disable-next-line functional/immutable-data
    marcRecord.leader = '00000nam a22000008i 4500';
  }

  // Add control fields
  // 007 for electronical publications
  if (electronical) {
    // For all electronical records
    marcRecord.insertField({tag: '007', value: 'cr||| ||||||||'});

    // For audiobooks
    if (audiobook) {
      marcRecord.insertField({tag: '007', value: 'sr|uunnnnnuneu'});
    }
  }

  // 007 for print sheet music
  if (sheetmusic && !electronical) {
    marcRecord.insertField({tag: '007', value: 'qu'});
  }

  // 008 added for all publications
  marcRecord.insertField({tag: '008', value: generate008({publication, electronical, sheetmusic, dissertation})});

  // Add datafields
  const dataFieldGenerators = [
    generate020,
    generate024,
    generate040,
    generate041,
    generate042,
    generate100,
    generate245,
    generate250,
    generate255,
    generate263,
    generate264a,
    generate264b,
    generate336,
    generate337,
    generate338,
    generate341,
    generate347,
    generate490,
    generateTestField,
    generate500,
    generate502,
    generate594,
    generate700,
    generate776,
    generateLOW
  ];

  // Generate datafields
  const generatorParams = {publication, electronical, sheetmusic, dissertation, map, audiobook, electronicalRecordPublicationType};

  const dataFields = dataFieldGenerators.map(dfg => dfg(generatorParams)).flat();

  // Add generated fields to record
  dataFields.forEach(df => marcRecord.appendField(df));

  return marcRecord;
  /* eslint-enable functional/no-conditional-statements */
}

// eslint-disable-next-line max-statements
function generate008({publication, electronical, sheetmusic, dissertation}) {
  const {language, year} = publication;

  /* eslint-disable functional/no-let, functional/no-conditional-statements */
  const date = new Date();

  // Constructing field without immutability constraint
  // 0-5
  let field = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

  // 6
  field += 's';

  // 7-10
  field += year ? year : '||||';

  // 11-14
  field += '    ';

  // 15-17
  field += 'fi ';

  if (sheetmusic) {
    // 18-22
    field += '||| |';

    // 23 - publication format
    if (electronical) {
      field += 'o';
    } else {
      field += ' ';
    }

    // 24-34
    field += '|||||||||||';
  } else {
    // 18-22
    field += '|||| ';

    // 23 - publication format
    if (electronical) {
      field += 'o';
    } else {
      field += ' ';
    }

    // 24-27
    field += dissertation ? 'm   ' : '    ';

    // 24-34
    field += ' |0| 0|';
  }

  // 35-37
  field += language ? language.toLowerCase() : '|||';

  // 38-39
  field += '| ';

  return field;
  /* eslint-enable functional/no-let, functional/no-conditional-statements */
}

function generate020({publication, electronical, sheetmusic, electronicalRecordPublicationType}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements */
  // For sheetmusic material, field is not produced
  if (sheetmusic) {
    return [];
  }

  // In case publication does not have identifier yet assigned, return empty field
  if (electronical && !publication.publicationIdentifierElectronical) {
    return [];
  } else if (!electronical && !publication.publicationIdentifierPrint) {
    return [];
  }

  // For non-sheetmusic, field is based on identifiers
  // Identifiers used are based on whether record is electronical or not
  // Electronical and print records should be separate entities so there is no case
  // Where 020 should contain identifiers from both

  const types = electronical ? publication.fileformat : publication.type;
  let identifiers;

  if (electronical) {
    identifiers = JSON.parse(publication.publicationIdentifierElectronical);
  } else {
    identifiers = JSON.parse(publication.publicationIdentifierPrint);
  }

  // 020 is generated for preview purposes also for requests that have not been yet given any identifiers
  if (Object.keys(identifiers).length === 0) {
    return addTypes('020', ' ', types, electronical, electronicalRecordPublicationType);
  }

  return _generateFields(identifiers, electronical, electronicalRecordPublicationType);


  function _generateFields(identifiers, electronical, electronicalRecordPublicationType) {
    const field = {tag: '020', ind1: ' ', ind2: ' '};

    // For electronical material, only one 020 is generated as each type will generate its own record
    if (electronical) {
      const identifier = Object.keys(identifiers).find(k => identifiers[k] === electronicalRecordPublicationType);
      if (!identifier) {
        throw new Error('Could not find the chosen electronical type from publication identifiers');
      }

      const typeStr = getTypeStr(identifiers[identifier], true);
      const subfields = typeStr
        ? [{code: 'a', value: identifier}, {code: 'q', value: typeStr}]
        : [{code: 'a', value: identifier}];

      return [{...field, subfields: [...subfields]}];
    }


    return Object.keys(identifiers).map(k => {
      // Get fileformat and construct $q based on it
      const typeStr = getTypeStr(identifiers[k], false);
      const subfields = typeStr
        ? [{code: 'a', value: k}, {code: 'q', value: typeStr}]
        : [{code: 'a', value: k}];

      return {...field, subfields: [...subfields]};
    });
  }

  /* eslint-enable functional/no-let,functional/no-conditional-statements */
}

function generate024({publication, electronical, sheetmusic, electronicalRecordPublicationType}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements */

  if (!sheetmusic) {
    return [];
  }

  // If there are no identifiers, no 024 is generated
  if (electronical && !publication.publicationIdentifierElectronical) {
    return [];
  }

  if (!electronical && !publication.publicationIdentifierPrint) {
    return [];
  }

  const types = electronical ? publication.fileformat : publication.type;
  let identifiers;

  if (electronical) {
    identifiers = JSON.parse(publication.publicationIdentifierElectronical);
  } else {
    identifiers = JSON.parse(publication.publicationIdentifierPrint);
  }

  // 024 is generated for preview purposes also for requests that have not been yet given any identifiers
  if (Object.keys(identifiers).length === 0) {
    return addTypes('024', '2', types, electronical, electronicalRecordPublicationType);
  }

  return _generateFields(identifiers, electronical, electronicalRecordPublicationType);

  function _generateFields(identifiers, electronical, electronicalRecordPublicationType) {
    const field = {tag: '024', ind1: '2', ind2: ' '};

    if (electronical) {
      const identifier = Object.keys(identifiers).find(k => identifiers[k] === electronicalRecordPublicationType);
      if (!identifier) {
        throw new Error('Could not find the chosen electronical type from publication identifiers');
      }

      const typeStr = getTypeStr(identifiers[identifier], true);
      const subfields = typeStr
        ? [{code: 'a', value: identifier}, {code: 'q', value: typeStr}]
        : [{code: 'a', value: identifier}];

      return [{...field, subfields: [...subfields]}];
    }

    return Object.keys(identifiers).map(k => {
      // Get fileformat and construct $q based on it
      const typeStr = getTypeStr(identifiers[k], electronical);
      const subfields = typeStr ? [
        {code: 'a', value: k},
        {code: 'q', value: typeStr}
      ] : [{code: 'a', value: k}];

      return {...field, subfields};
    });
  }
  /* eslint-enable functional/no-let,functional/no-conditional-statements */
}

function generate040() {
  return [
    {
      tag: '040',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        {code: 'a', value: 'FI-NL'},
        {code: 'b', value: 'fin'},
        {code: 'e', value: 'rda'}
      ]
    }
  ];
}

function generate041({publication}) {
  if (publication.language) {
    return [
      {
        tag: '041',
        ind1: '0',
        ind2: ' ',
        subfields: [{code: 'a', value: publication.language.toLowerCase()}]
      }
    ];
  }

  return [];
}

function generate042() {
  return [
    {
      tag: '042',
      ind1: ' ',
      ind2: ' ',
      subfields: [{code: 'a', value: 'finb'}]
    }
  ];
}

function generate100({publication}) {
  if (publication.role1 && publication.role1.includes('AUTHOR')) {
    return [
      {
        tag: '100',
        ind1: '1',
        ind2: ' ',
        subfields: [{code: 'a', value: `${publication.lastName1}, ${publication.firstName1}.`}]
      }
    ];
  }

  return [];
}

function generate245({publication}) {
  // Fallback
  if (!publication.title) {
    return [];
  }

  const ind1 = publication.role1 && publication.role1.includes('AUTHOR') ? '1' : '0';
  const ind2 = '0';
  const subfieldA = publication.subtitle ? `${publication.title} :` : `${publication.title}.`;
  const subfieldB = publication.subtitle ? `${publication.subtitle}.` : undefined;

  return [
    {
      tag: '245',
      ind1,
      ind2,
      subfields: subfieldB
        ? [{code: 'a', value: subfieldA}, {code: 'b', value: subfieldB}]
        : [{code: 'a', value: subfieldA}]
    }
  ];
}

function generate250({publication}) {
  if (publication.edition) {
    return [
      {
        tag: '250',
        ind1: ' ',
        ind2: ' ',
        subfields: [{code: 'a', value: `${publication.edition}. painos.`}]
      }
    ];
  }

  return [];
}

function generate255({publication, map}) {
  if (map && publication.mapScale) {
    return [
      {
        tag: '255',
        ind1: ' ',
        ind2: ' ',
        subfields: [{code: 'a', value: `${publication.mapScale}`}]
      }
    ];
  }

  return [];
}

function generate263({publication}) {
  if (publication.year && publication.month) {
    const subfieldA = publication.month ? `${publication.year}${publication.month}` : `${publication.year}KK`;
    return [
      {
        tag: '263',
        ind1: ' ',
        ind2: ' ',
        subfields: [{code: 'a', value: subfieldA}]
      }
    ];
  }

  return [];
}

function generate264a({publication, dissertation}) {
  // Do not generate if there are no values for subfield A
  if ((!dissertation && !publication.city) || (dissertation && !publication.locality)) { // eslint-disable-line
    return [];
  }

  // Do not generate if there are no values for subfields b and c
  if (!publication.officialName || !publication.year) {
    return [];
  }

  const subfieldA = dissertation ? `${publication.locality} :` : `${publication.city} :`;

  return [
    {
      tag: '264',
      ind1: ' ',
      ind2: '1',
      subfields: [
        {code: 'a', value: subfieldA},
        {code: 'b', value: `${publication.officialName},`},
        {code: 'c', value: `${publication.year}.`}
      ]
    }
  ];
}

function generate264b({publication, electronical}) {
  if (electronical) {
    return [];
  }

  // Require subfield values to exist
  if (!publication.printingHouseCity || !publication.printingHouse) {
    return [];
  }

  return [
    {
      tag: '264',
      ind1: ' ',
      ind2: '3',
      subfields: [
        {code: 'a', value: `${publication.printingHouseCity} :`},
        {code: 'b', value: `${publication.printingHouse}`}
      ]
    }
  ];
}

function generate336({sheetmusic, map, audiobook}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements */
  let subfields;

  if (sheetmusic) {
    subfields = [
      {code: 'a', value: 'nuottikirjoitus'},
      {code: 'b', value: 'ntm'}
    ];
  } else if (map) {
    subfields = [
      {code: 'a', value: 'kartografinen kuva'},
      {code: 'b', value: 'cri'}
    ];
  } else if (audiobook) {
    subfields = [
      {code: 'a', value: 'puhe'},
      {code: 'b', value: 'spw'}
    ];
  } else {
    subfields = [
      {code: 'a', value: 'teksti'},
      {code: 'b', value: 'txt'}
    ];
  }

  return [
    {
      tag: '336',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        ...subfields,
        {code: '2', value: 'rdacontent'}
      ]
    }
  ];
  /* eslint-enable functional/no-let,functional/no-conditional-statements */
}

function generate337({electronical}) {
  const subfields = electronical ? [
    {code: 'a', value: 'tietokonekäyttöinen'},
    {code: 'b', value: 'c'}
  ] : [
    {code: 'a', value: 'käytettävissä ilman laitetta'},
    {code: 'b', value: 'n'}
  ];

  return [
    {
      tag: '337',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        ...subfields,
        {code: '2', value: 'rdamedia'}
      ]
    }
  ];
}

function generate338({electronical}) {
  const subfields = electronical ? [
    {code: 'a', value: 'verkkoaineisto'},
    {code: 'b', value: 'cr'}
  ] : [
    {code: 'a', value: 'nide'},
    {code: 'b', value: 'nc'}
  ];

  return [
    {
      tag: '338',
      ind1: ' ',
      ind2: ' ',
      subfields: [
        ...subfields,
        {code: '2', value: 'rdacarrier'}
      ]
    }
  ];
}

function generate341({electronical, audiobook}) {
  if (electronical) {
    if (audiobook) {
      return [
        {
          tag: '341',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'auditory'},
            {code: '2', value: 'sapdv'}
          ]
        }
      ];
    }

    return [
      {
        tag: '341',
        ind1: ' ',
        ind2: ' ',
        subfields: [
          {code: 'a', value: 'textual'},
          {code: '2', value: 'sapdv'}
        ]
      }
    ];
  }

  return [];
}

function generate347({electronical, audiobook, electronicalRecordPublicationType}) {
  if (!electronical) {
    return [];
  }

  if (audiobook && electronicalRecordPublicationType === ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3) {
    return [
      {
        tag: '347', subfields: [
          {code: 'a', value: 'äänitiedosto'},
          {code: 'b', value: 'MP3'}
        ]
      }
    ];
  }

  return [];
}

function generate490({publication}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements */

  if (publication.series) {
    let subfieldA = publication.series;
    let subfieldX = publication.issn;
    const subfieldV = publication.volume;

    if (!subfieldX && subfieldV) {
      subfieldA += ' ;';
    } else if (subfieldX && subfieldV) {
      subfieldA += ',';
      subfieldX += ' ;';
    } else if (subfieldX && !subfieldV) {
      subfieldA += ',';
    }

    return [
      {
        tag: '490',
        ind1: '0',
        ind2: ' ',
        subfields: [
          {code: 'a', value: subfieldA},
          subfieldX ? {code: 'x', value: subfieldX} : undefined,
          subfieldV ? {code: 'v', value: subfieldV} : undefined
        ].filter(v => v) // Filters undefined subfields
      }
    ];
  }

  return [];
  /* eslint-enable functional/no-let,functional/no-conditional-statements */
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
  return {tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Ennakkotieto / Kansalliskirjasto.'}]};
}

function generate502({publication, dissertation}) {
  if (dissertation && publication.officialName) {
    const subfieldA = getSubfieldAValue(publication.officialName, publication.year);

    return [
      {
        tag: '502',
        ind1: ' ',
        ind2: ' ',
        subfields: [{code: 'a', value: subfieldA}]
      }
    ];
  }

  return [];


  function getSubfieldAValue(officialName, publicationYear) {
    if (!publicationYear) {
      return `Väitöskirja--${officialName}.`;
    }

    return `Väitöskirja--${officialName}, ${publicationYear}.`;
  }
}

function generate594() {
  return [
    {
      tag: '594',
      ind1: ' ',
      ind2: ' ',
      subfields: [{code: 'a', value: 'Ennakkotieto / Kansalliskirjasto'}, {code: '5', value: 'FENNI'}]
    },
    {
      tag: '594',
      ind1: ' ',
      ind2: ' ',
      subfields: [{code: 'a', value: 'EI VASTAANOTETTU'}, {code: '5', value: 'FENNI'}]
    }
  ];
}

function generate700({publication}) {
  /* eslint-disable functional/no-let,functional/no-conditional-statements */
  let fields = [];

  if (publication.role1 && !publication.role1.includes('AUTHOR')) {
    fields = [
      ...fields,
      {
        tag: '700',
        ind1: '1',
        ind2: ' ',
        subfields: [{code: 'a', value: `${publication.lastName1}, ${publication.firstName1}.`}]
      }
    ];
  }

  [2, 3, 4].forEach(v => {
    if (publication[`firstName${v}`] && publication[`lastName${v}`]) {
      fields = [
        ...fields,
        {
          tag: '700',
          ind1: '1',
          ind2: ' ',
          subfields: [{code: 'a', value: `${publication[`lastName${v}`]}, ${publication[`firstName${v}`]}.`}]
        }
      ];
    }
  });

  return fields;
  /* eslint-enable functional/no-let,functional/no-conditional-statements */
}

function generate776({publication, electronical}) {
  if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT_ELECTRONICAL) {
    // For electronical publication get printed items identifiers and for printed publication get electronical publication identifiers
    const identifiers = electronical ? parseIdentifiers(publication, false) : parseIdentifiers(publication, true);

    if (identifiers) {
      return Object.keys(identifiers).map(identifier => {
        const subfieldI = electronical ? 'Painettu:' : 'Verkkoaineisto:';
        return {
          tag: '776',
          ind1: '0',
          ind2: '8',
          subfields: [
            {code: 'i', value: subfieldI},
            {code: 'z', value: identifier}
          ]
        };
      });
    }
  }

  return [];
}

function generateLOW() {
  return {tag: 'LOW', ind1: '', ind2: '', subfields: [{code: 'a', value: 'FIKKA'}]};
}

/**
 * Parses identifier information from publication
 * @param {Object} publication Publication object
 * @param {boolean} electronical Boolean defining whether to parse electronical format information or print format information
 * @returns {Object} Identifier information as object
 */
function parseIdentifiers(publication, electronical) {
  if (electronical) {
    return publication.publicationIdentifierElectronical ? JSON.parse(publication.publicationIdentifierElectronical) : null;
  }

  return publication.publicationIdentifierPrint ? JSON.parse(publication.publicationIdentifierPrint) : null;
}

// eslint-disable-next-line max-params
function addTypes(field, ind1, types, electronical = false, electronicalRecordPublicationType = null) {
  if (types) {
    const datafield = {tag: field, ind1, ind2: ' '};

    if (electronical) {
      if (!electronicalRecordPublicationType) {
        return [];
      }

      const subfields = [
        {code: 'a', value: ''},
        {code: 'q', value: electronicalRecordPublicationType}
      ];

      return subfields.some(sf => sf.value !== '') ? [{...datafield, subfields}] : [];
    }

    return types.map(t => {
      const subfields = [
        {code: 'a', value: ''},
        t ? {code: 'q', value: getTypeStr(t, electronical)} : undefined
      ];

      return subfields.some(sf => sf.value !== '') ? {...datafield, subfields} : undefined;
    }).filter(f => f); // Filters undefined fields
  }

  return [];
}

function getTypeStr(type, electronical) {
  return electronical ? getFileFormat(type) : getType(type);
}

function isSheetMusic(publication) {
  return publication.publicationType === ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC;
}

function isElectronical(electronicalRecordPublicationType) {
  if (electronicalRecordPublicationType === null) {
    return false;
  }

  if (Object.keys(ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES).includes(electronicalRecordPublicationType)) {
    return true;
  }

  throw new Error('Unsupported type definition for MARC record generation in ISBN-registry');
}

function isDissertation(publication) {
  return publication.publicationType === ISBN_REGISTRY_PUBLICATION_TYPES.DISSERTATION;
}

function isMap(publication) {
  return publication.publicationType === ISBN_REGISTRY_PUBLICATION_TYPES.MAP;
}

function isAudiobook(electronicalRecordPublicationType) {
  const audioFormats = [ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.CD_ROM, ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3];
  if (electronicalRecordPublicationType && audioFormats.includes(electronicalRecordPublicationType)) {
    return true;
  }

  return false;
}

function getType(type) {
  if (!type || type === '') {
    return '';
  }

  if (type === ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.PAPERBACK) {
    return 'pehmeäkantinen';
  }

  if (type === ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.HARDBACK) {
    return 'kovakantinen';
  }

  if (type === ISBN_REGISTRY_PUBLICATION_PRINT_TYPES.SPIRAL_BINDING) {
    return 'kierreselkä';
  }

  return '';
}


function getFileFormat(format) {
  if (!format || format === '') {
    return '';
  }

  if (format === ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.PDF) {
    return 'PDF';
  }

  if (format === ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.EPUB) {
    return 'EPUB';
  }

  if (format === ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.CD_ROM) {
    return 'CD-ROM';
  }

  if (format === ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES.MP3) {
    return 'MP3';
  }

  return '';
}
