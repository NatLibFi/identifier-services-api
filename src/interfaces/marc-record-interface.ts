import { DateTime } from 'luxon';
import { MarcRecord } from '@natlibfi/marc-record';

import { translateManifestationType } from './monograph/monograph-message-template-utils.ts';

import { MONOGRAPH_MANIFESTATION_TYPES, MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL } from '../constants.ts';

import type { MonographAuthor } from '../db/types/monograph/types-monograph-author.ts';
import type { MonographSeriesInformation } from '../db/types/monograph/types-monograph-publication-manifestation.ts';
import type { UnknownObject } from '../generic-types.ts';
import { isProduction } from '../utils/generic-utils.ts';

export interface CreateMarcRecordInformation {
  isElectronical: boolean;
  isMonograph: boolean;
  isSerial: boolean;
  isSheetMusic: boolean;
  isDissertation: boolean;
  isMap: boolean;
  isAudiobook: boolean;
  title: string;
  subtitle?: string | null;
  isbnIdentifiers?: Record<string, string[]>; // {"PDF": ["978-951-1..."]}
  ismnIdentifiers?: Record<string, string[]>; // {"PDF": ["979-0-1..."]}
  issnIdentifier?: string | null;
  language?: string | null;
  publicationYear?: string | null;
  publicationMonth?: string | null;
  publisherName?: string | null;
  publisherPlace?: string | null;
  printerName?: string | null;
  printerPlace?: string | null;
  edition?: string | null;
  mapScale?: string | null;
  mainAuthor?: MonographAuthor | null;
  contributors?: MonographAuthor[];
  monographSeries?: MonographSeriesInformation[];
  serialFirstNumber?: string | null;
  serialFrequency?: string | null;
  serialPublicationType?: string | null;
  serialMainSeries?: {
    title: string;
    issn: string | null;
  } | null;
  serialSubseries?: {
    title: string;
    issn: string | null;
  } | null;
  serialAnotherMedium?: {
    title: string;
    issn: string | null;
  } | null;
  serialPreviousSeries?: {
    title: string;
    issn: string | null;
  } | null;
  serialUrl?: string | null;
  serialMedium?: string | null;
}

interface ControlField {
  tag: string;
  value: string;
}

interface Subfield {
  code: string;
  value: string;
}

interface DataField {
  tag: string;
  subfields: Subfield[];
  ind1?: string;
  ind2?: string;
}

export default function generateMarcRecord(publicationInfo: CreateMarcRecordInformation): UnknownObject {
  const marcRecord = new MarcRecord();

  marcRecord.leader = generateLeader(publicationInfo);

  // Add control fields
  const f007s = generate007(publicationInfo);
  f007s.forEach((f007) => marcRecord.insertField(f007));

  const f008 = generate008(publicationInfo);
  marcRecord.insertField(f008);

  const datafieldGenerators = [
    generate020,
    generate022,
    generate024,
    generate040,
    generate041,
    generate042,
    generate100,
    generate222,
    generate245,
    generate250,
    generate255,
    generate263,
    generate264,
    generate310,
    generate336,
    generate337,
    generate338,
    generate341,
    generate347,
    generate362,
    generate490,
    generate500,
    generate502,
    generate594,
    generate700,
    generate710,
    generate760,
    generate762,
    generate776,
    generate780,
    generate856,
    generate935,
    generateLOW,
  ];

  // Generate datafields and append them to the record
  datafieldGenerators.forEach((g) => marcRecord.appendFields(g(publicationInfo)));

  return marcRecord;
}

export function generateLeader(publicationInfo: CreateMarcRecordInformation): string {
  const { isMonograph, isSerial, isSheetMusic } = publicationInfo;

  if (isSheetMusic && isMonograph) {
    return '00000ncm a22000008i 4500';
  } else if (isMonograph) {
    return '00000nam a22000008i 4500';
  } else if (isSerial) {
    return '00000nas a22000008i 4500';
  }

  throw new Error('Could not generate leader');
}

export function generate007(publicationInfo: CreateMarcRecordInformation): ControlField[] {
  const { isElectronical, isMonograph, isSerial, isSheetMusic, isAudiobook } = publicationInfo;
  const result: ControlField[] = [];

  if (isMonograph && isElectronical) {
    result.push({ tag: '007', value: 'cr||| ||||||||' });
  }

  if (isSerial && isElectronical) {
    result.push({ tag: '007', value: 'cr||||||||||||' });
  }

  if (isMonograph && isAudiobook) {
    result.push({ tag: '007', value: 'sr|uunnnnnuneu' });
  }

  if (isMonograph && isSheetMusic) {
    result.push({ tag: '007', value: 'qu' });
  }

  return result;
}

export function generate008(publicationInfo: CreateMarcRecordInformation): ControlField {
  const {
    isElectronical,
    isMonograph,
    isSerial,
    isSheetMusic,
    isDissertation,
    language,
    publicationYear,
    serialFrequency,
    serialPublicationType,
  } = publicationInfo;

  const date = new Date();

  // 0-5
  let value = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

  // 6
  if (isMonograph) {
    value += 's';
  } else if (isSerial) {
    value += 'c';
  } else {
    value += '|';
  }

  // 7-10
  value += publicationYear ? publicationYear : '||||';

  // 11-14
  if (isMonograph) {
    value += '    ';
  } else if (isSerial) {
    value += '9999';
  } else {
    value += '||||';
  }

  // 15-17
  value += 'fi ';

  if (isSheetMusic) {
    // 18-23 for sheet music
    value += isElectronical ? '||| |o' : '||| | ';

    // 24-34 for sheet music
    value += '|||||||||||';
  }

  if (isMonograph && !isSheetMusic) {
    // 18-23 for other monographs than sheet music
    value += isElectronical ? '|||| o' : '||||  ';

    // 24-27 for other monographs than sheet music
    value += isDissertation ? 'm   ' : '    ';

    // 24-34 for other monographs than sheet music
    value += ' |0| 0|';
  }

  if (isSerial) {
    // 18 for serial
    value += serialFrequency ? serialFrequency : ' ';

    // 19-20 for serial
    value += '| ';

    // 21 for serial
    if (!serialPublicationType) {
      throw new Error('Serial publication requires to have publication type defined');
    }

    value += getSerialPublicationTypeInfo(serialPublicationType);

    // 22 for serial
    value += '|';

    // 23 for serial
    value += isElectronical ? 'o' : ' ';

    // 24-34 for serial
    value += '     0|||b0';
  }

  // 35-37
  value += language ? language.toLowerCase() : '|||';

  // 38-39
  value += '| ';

  // Confirm field length
  if (value.length !== 40) {
    throw new Error('Field 008 generator produced field with invalid length');
  }

  return { tag: '008', value };

  function getSerialPublicationTypeInfo(serialPublicationType: string | undefined) {
    const publicationTypeMap: string[] = [
      // ISSN_PUBLICATION_TYPES.STAFFMAGAZINE,
      // ISSN_PUBLICATION_TYPES.MEMBERSHIPMAGAZINE,
      // ISSN_PUBLICATION_TYPES.NEWSLETTER,
      // ISSN_PUBLICATION_TYPES.JOURNAL,
      // ISSN_PUBLICATION_TYPES.FREEPAPER
    ];

    if (!serialPublicationType || !publicationTypeMap.includes(serialPublicationType)) {
      return '|';
    }

    // TODO: uncomment when ISSN constants are available
    // if (publicationType === ISSN_PUBLICATION_TYPES.NEWSPAPER) {
    // return 'n';
    // }
    //
    // if (publicationType === ISSN_PUBLICATION_TYPES.MONOGRAPHY) {
    // return 'm';
    // }

    return 'p';
  }
}

export function generate020(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical, isbnIdentifiers } = publicationInfo;

  if (!isbnIdentifiers) {
    return [];
  }

  return Object.entries(isbnIdentifiers)
    .map(([manifestationType, isbnIdentifiers]) => {
      // Consider only identifiers for manifestation types that satisfy "isElectronical"
      // Other identifier type identifiers are placed to f776
      const isElectronicalManifestationType = Object.keys(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL).includes(
        manifestationType,
      );

      // Two if clauses are defined for readability
      if (isElectronical && !isElectronicalManifestationType) {
        return null; // Note: these will be stripped by filter
      }

      if (!isElectronical && isElectronicalManifestationType) {
        return null; // Note: these will be stripped by filter
      }

      const translatedManifestationType = translateManifestationType(manifestationType, 'fi-FI');

      return isbnIdentifiers.map((isbnIdentifier) => ({
        tag: '020',
        subfields: [
          { code: 'a', value: isbnIdentifier },
          { code: 'q', value: translatedManifestationType },
        ],
      }));
    })
    .flat()
    .filter((v) => v !== null);
}

export function generate022(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, issnIdentifier } = publicationInfo;

  if (!isSerial || !issnIdentifier) {
    return [];
  }

  return [
    {
      tag: '022',
      ind1: '0',
      subfields: [
        { code: 'a', value: issnIdentifier },
        { code: '2', value: '_a' },
      ],
    },
  ];
}

export function generate024(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical, ismnIdentifiers } = publicationInfo;

  if (!ismnIdentifiers) {
    return [];
  }

  return Object.entries(ismnIdentifiers)
    .map(([manifestationType, ismnIdentifiers]) => {
      // Consider only identifiers for manifestation types that satisfy "isElectronical"
      // Other identifier type identifiers are placed to f776
      const isElectronicalManifestationType = Object.keys(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL).includes(
        manifestationType,
      );

      // Two if clauses are defined for readability
      if (isElectronical && !isElectronicalManifestationType) {
        return null; // Note: these will be stripped by filter
      }

      if (!isElectronical && isElectronicalManifestationType) {
        return null; // Note: these will be stripped by filter
      }

      const translatedManifestationType = translateManifestationType(manifestationType, 'fi-FI');

      return ismnIdentifiers.map((ismnIdentifier) => ({
        tag: '024',
        ind1: '2',
        subfields: [
          { code: 'a', value: ismnIdentifier },
          { code: 'q', value: translatedManifestationType },
        ],
      }));
    })
    .flat()
    .filter((v) => v !== null);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generate040(_publicationInfo: CreateMarcRecordInformation): DataField[] {
  return [
    {
      tag: '040',
      subfields: [
        { code: 'a', value: 'FI-NL' },
        { code: 'b', value: 'fin' },
        { code: 'e', value: 'rda' },
      ],
    },
  ];
}

export function generate041(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { language } = publicationInfo;

  if (!language) {
    return [];
  }

  return [
    {
      tag: '041',
      ind1: '0',
      subfields: [{ code: 'a', value: language.toLowerCase() }],
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generate042(_publicationInfo: CreateMarcRecordInformation): DataField[] {
  return [
    {
      tag: '042',
      subfields: [{ code: 'a', value: 'finb' }],
    },
  ];
}

export function generate100(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, mainAuthor } = publicationInfo;

  if (!isMonograph || !mainAuthor) {
    return [];
  }

  const hasLastName = Boolean(mainAuthor.last_name);
  const ind1 = hasLastName ? '1' : '0';

  const subfieldAValue = hasLastName ? `${mainAuthor.last_name}, ${mainAuthor.first_name}` : mainAuthor.first_name;

  return [
    {
      tag: '100',
      ind1,
      subfields: [{ code: 'a', value: subfieldAValue }],
    },
  ];
}

export function generate222(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, isElectronical, title, serialAnotherMedium } = publicationInfo;

  if (!title || !isSerial) {
    return [];
  }

  // TODO: add constraint of "serialMedium === ISSN_MEDIUM.OTHER ||"
  if (serialAnotherMedium) {
    return [
      {
        tag: '222',
        ind2: '0',
        subfields: [{ code: 'a', value: title }],
      },
    ];
  }

  const subfieldBValue = isElectronical ? '(Verkkoaineisto)' : '(Painettu)';

  return [
    {
      tag: '222',
      ind2: '0',
      subfields: [
        { code: 'a', value: title },
        { code: 'b', value: subfieldBValue },
      ],
    },
  ];
}

export function generate245(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, mainAuthor, title, subtitle } = publicationInfo;

  const ind1 = !mainAuthor || isSerial ? '0' : '1';

  const subfieldAValue = subtitle ? `${title} :` : `${title}.`;
  const subfieldBValue = subtitle ? `${subtitle}.` : undefined;

  const subfields = [{ code: 'a', value: subfieldAValue }];

  if (subfieldBValue) {
    subfields.push({ code: 'b', value: subfieldBValue });
  }

  return [
    {
      tag: '245',
      ind1,
      ind2: '0',
      subfields,
    },
  ];
}

export function generate250(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, edition } = publicationInfo;

  if (!isMonograph || !edition) {
    return [];
  }

  return [
    {
      tag: '250',
      subfields: [{ code: 'a', value: `${edition}. painos.` }],
    },
  ];
}

export function generate255(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, isMap, mapScale } = publicationInfo;

  if (!isMonograph || !isMap || !mapScale) {
    return [];
  }

  return [
    {
      tag: '255',
      subfields: [{ code: 'a', value: mapScale }],
    },
  ];
}

export function generate263(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, isSerial, publicationYear, publicationMonth } = publicationInfo;

  if (!isMonograph || !publicationYear) {
    return [];
  }

  let subfieldAValue = '';

  if (isSerial) {
    subfieldAValue = `${publicationYear}--`;
  } else {
    subfieldAValue = publicationMonth ? `${publicationYear}${publicationMonth}` : `${publicationYear}KK`;
  }

  return [
    {
      tag: '263',
      subfields: [{ code: 'a', value: subfieldAValue }],
    },
  ];
}

export function generate264(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, publicationYear, publisherName, publisherPlace, printerName, printerPlace } = publicationInfo;

  const result: DataField[] = [];

  if (publisherName && publisherPlace && publicationYear) {
    const yearDefinition = isSerial ? `${publicationYear}-` : `${publicationYear}.`;

    result.push({
      tag: '264',
      ind1: '1',
      subfields: [
        { code: 'a', value: publisherPlace },
        { code: 'b', value: `${publisherName}, ` },
        { code: 'c', value: yearDefinition },
      ],
    });
  }

  if (printerName) {
    const subfields = [{ code: 'b', value: printerName }];

    if (printerPlace) {
      subfields.unshift({ code: 'a', value: `${printerPlace} :` });
    }

    result.push({
      tag: '264',
      ind1: '3',
      subfields,
    });
  }

  return result;
}

export function generate310(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { serialFrequency } = publicationInfo;

  const translatedFrequency = translateFrequency(serialFrequency);
  if (!translatedFrequency) {
    return [];
  }

  return [
    {
      tag: '310',
      subfields: [{ code: 'a', value: translatedFrequency }],
    },
  ];

  // TODO: consider if need to move to be commonly used
  function translateFrequency(serialFrequency: string | null | undefined): string | null {
    if (!serialFrequency) {
      return null;
    }

    const translationTable = {
      a: 'Kerran vuodessa',
      f: 'Kaksi kertaa vuodessa',
      q: 'Neljä kertaa vuodessa',
      b: 'Kuusi kertaa vuodessa',
      m: 'Kerran kuukaudessa',
      w: 'Kerran viikossa',
      d: 'Päivittäin',
      k: 'Päivitetään jatkuvasti',
      '#': 'Epäsäännöllinen',
      z: 'Muu',
    };

    // @ts-expect-error untyped test of object key inclusion
    return Object.keys(translationTable).includes(serialFrequency) ? translationTable[serialFrequency] : null;
  }
}

export function generate336(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSheetMusic, isMap, isAudiobook } = publicationInfo;

  const subfields = [{ code: '2', value: 'rdacontent' }];

  if (isSheetMusic) {
    subfields.unshift({ code: 'b', value: 'ntm' });
    subfields.unshift({ code: 'a', value: 'nuottikirjoitus' });
  } else if (isMap) {
    subfields.unshift({ code: 'b', value: 'cri' });
    subfields.unshift({ code: 'a', value: 'kartografinen kuva' });
  } else if (isAudiobook) {
    subfields.unshift({ code: 'b', value: 'spw' });
    subfields.unshift({ code: 'a', value: 'puhe' });
  } else {
    subfields.unshift({ code: 'b', value: 'txt' });
    subfields.unshift({ code: 'a', value: 'teksti' });
  }

  return [
    {
      tag: '336',
      subfields,
    },
  ];
}

export function generate337(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical } = publicationInfo;

  const subfields = [{ code: '2', value: 'rdamedia' }];

  if (isElectronical) {
    subfields.unshift({ code: 'b', value: 'c' });
    subfields.unshift({ code: 'a', value: 'tietokonekäyttöinen' });
  } else {
    subfields.unshift({ code: 'b', value: 'n' });
    subfields.unshift({ code: 'a', value: 'käytettävissä ilman laitetta' });
  }

  return [
    {
      tag: '337',
      subfields,
    },
  ];
}

export function generate338(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical } = publicationInfo;

  const subfields = [{ code: '2', value: 'rdacarrier' }];

  if (isElectronical) {
    subfields.unshift({ code: 'b', value: 'cr' });
    subfields.unshift({ code: 'a', value: 'verkkoaineisto' });
  } else {
    subfields.unshift({ code: 'b', value: 'nc' });
    subfields.unshift({ code: 'a', value: 'nide' });
  }

  return [
    {
      tag: '338',
      subfields,
    },
  ];
}

export function generate341(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical, isMonograph, isAudiobook } = publicationInfo;

  if (!isMonograph || !isElectronical) {
    return [];
  }

  const subfields: Subfield[] = [];

  if (isAudiobook) {
    subfields.push({ code: 'a', value: 'auditory' });
  } else {
    subfields.push({ code: 'a', value: 'textual' });
  }

  subfields.push({ code: '2', value: 'sapdv' });

  return [
    {
      tag: '341',
      subfields,
    },
  ];
}

export function generate347(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isbnIdentifiers = {}, ismnIdentifiers = {} } = publicationInfo;
  const manifestationTypes = Object.keys(isbnIdentifiers).concat(Object.keys(ismnIdentifiers));
  const isMp3 = manifestationTypes.some((t) => t === MONOGRAPH_MANIFESTATION_TYPES.MP3);

  if (!isMp3) {
    return [];
  }

  return [
    {
      tag: '347',
      subfields: [
        { code: 'a', value: 'äänitiedosto' },
        { code: 'b', value: 'MP3' },
      ],
    },
  ];
}

export function generate362(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, serialFirstNumber } = publicationInfo;

  if (!isSerial || !serialFirstNumber) {
    return [];
  }

  return [
    {
      tag: '362',
      ind1: '0',
      subfields: [{ code: 'a', value: `${serialFirstNumber}-` }],
    },
  ];
}

export function generate490(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, monographSeries } = publicationInfo;

  if (!isMonograph || !monographSeries) {
    return [];
  }

  return monographSeries.map(({ name, volume, issn }) => {
    let subfieldAValue = name;
    let subfieldXValue = issn ?? '';

    if (!subfieldXValue && volume) {
      subfieldAValue += ' ;';
    } else if (subfieldXValue && volume) {
      subfieldAValue += ',';
      subfieldXValue += ' ;';
    } else if (subfieldXValue && !volume) {
      subfieldAValue += ',';
    }

    const subfields: Subfield[] = [{ code: 'a', value: subfieldAValue }];

    if (subfieldXValue) {
      subfields.push({ code: 'x', value: subfieldXValue });
    }

    if (volume) {
      subfields.push({ code: 'v', value: volume });
    }

    return {
      tag: '490',
      ind1: '0',
      subfields,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generate500(_publicationInfo: CreateMarcRecordInformation): DataField[] {
  const result: DataField[] = [];

  if (!isProduction()) {
    result.push({
      tag: '500',
      ind1: ' ',
      ind2: ' ',
      subfields: [{ code: 'a', value: 'TUNNISTEREKISTERIN TESTITIETUE.' }],
    });
  }

  result.push({
    tag: '500',
    ind1: ' ',
    ind2: ' ',
    subfields: [{ code: 'a', value: 'Ennakkotieto / Kansalliskirjasto.' }],
  });

  return result;
}

export function generate502(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isDissertation, publicationYear, publisherName } = publicationInfo;

  if (!isDissertation || !publisherName) {
    return [];
  }

  const subfieldAValue = publicationYear
    ? `Väitöskirja--${publisherName}, ${publicationYear}.`
    : `Väitöskirja--${publisherName}.`;

  return [
    {
      tag: '502',
      subfields: [{ code: 'a', value: subfieldAValue }],
    },
  ];
}

export function generate594(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph } = publicationInfo;

  const result = [
    {
      tag: '594',
      subfields: [
        { code: 'a', value: 'Ennakkotieto / Kansalliskirjasto' },
        { code: '5', value: 'FENNI' },
      ],
    },
  ];

  if (isMonograph) {
    result.push({
      tag: '594',
      subfields: [
        { code: 'a', value: 'EI VASTAANOTETTU' },
        { code: '5', value: 'FENNI' },
      ],
    });
  }

  return result;
}

export function generate700(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, contributors } = publicationInfo;

  if (!isMonograph || !contributors) {
    return [];
  }

  return contributors.map((c) => {
    const subfieldAValue = c.last_name ? `${c.last_name}, ${c.first_name}.` : `${c.first_name}.`;
    const ind1 = c.last_name ? '1' : '0';

    return {
      tag: '700',
      ind1,
      subfields: [{ code: 'a', value: subfieldAValue }],
    };
  });
}

export function generate710(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, publisherName } = publicationInfo;

  if (!isSerial || !publisherName) {
    return [];
  }

  return [
    {
      tag: '710',
      ind1: '2',
      subfields: [{ code: 'a', value: `${publisherName}.` }],
    },
  ];
}

export function generate760(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, serialMainSeries } = publicationInfo;

  if (!isSerial || !serialMainSeries) {
    return [];
  }

  const subfields = [{ code: 't', value: serialMainSeries.title }];

  if (serialMainSeries.issn) {
    subfields.push({ code: 'x', value: serialMainSeries.issn });
  }

  subfields.push({ code: '9', value: 'FENNI<KEEP>' });

  return [
    {
      tag: '760',
      ind1: '0',
      subfields,
    },
  ];
}

export function generate762(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, serialSubseries } = publicationInfo;

  if (!isSerial || !serialSubseries) {
    return [];
  }

  const subfields = [{ code: 't', value: serialSubseries.title }];

  if (serialSubseries.issn) {
    subfields.push({ code: 'x', value: serialSubseries.issn });
  }

  subfields.push({ code: '9', value: 'FENNI<KEEP>' });

  return [
    {
      tag: '762',
      ind1: '0',
      subfields,
    },
  ];
}

export function generate776(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isMonograph, isSerial, isElectronical, isbnIdentifiers, serialAnotherMedium } = publicationInfo;

  // For monoragph, entries are created of opposite type (electronical/print) identifiers than the rest of record considers
  if (isMonograph && isbnIdentifiers) {
    return Object.entries(isbnIdentifiers)
      .map(([manifestationType, isbns]) => {
        // Consider only identifiers for manifestation types that satisfy "isElectronical"
        // Other identifier type identifiers are placed to f776
        const isElectronicalManifestationType = Object.keys(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL).includes(
          manifestationType,
        );

        // Two if clauses are defined for readability
        if (isElectronical && isElectronicalManifestationType) {
          return null; // Note: these will be stripped by filter
        }

        if (!isElectronical && !isElectronicalManifestationType) {
          return null; // Note: these will be stripped by filter
        }

        const subfieldIValue = isElectronical ? 'Painettu:' : 'Verkkoaineisto:';

        return isbns.map((isbn) => ({
          tag: '776',
          ind1: '0',
          ind2: '8',
          subfields: [
            { code: 'i', value: subfieldIValue },
            { code: 'z', value: isbn },
          ],
        }));
      })
      .flat()
      .filter((v) => v !== null);
  }

  // For serial, entries are created from another medium if it's defined
  if (isSerial && serialAnotherMedium) {
    const subfieldIValue = isElectronical ? 'Painettu:' : 'Verkkoaineisto:';

    const subfields = [
      { code: 'i', value: subfieldIValue },
      { code: 't', value: serialAnotherMedium.title },
    ];

    if (serialAnotherMedium.issn) {
      subfields.push({ code: 'x', value: serialAnotherMedium.issn });
    }

    return [
      {
        tag: '776',
        ind1: '0',
        ind2: '8',
        subfields,
      },
    ];
  }

  return [];
}

export function generate780(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial, serialPreviousSeries } = publicationInfo;

  if (!isSerial || !serialPreviousSeries) {
    return [];
  }

  const subfields = [{ code: 't', value: serialPreviousSeries.title }];

  if (serialPreviousSeries.issn) {
    subfields.push({ code: 'x', value: serialPreviousSeries.issn });
  }

  subfields.push({ code: '9', value: 'FENNI<KEEP>' });

  return [
    {
      tag: '780',
      ind1: '0',
      ind2: '0',
      subfields,
    },
  ];
}

export function generate856(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isElectronical, isSerial, serialUrl } = publicationInfo;

  if (!isSerial || !isElectronical || !serialUrl) {
    return [];
  }

  return [
    {
      tag: '856',
      ind1: '4',
      ind2: '0',
      subfields: [
        { code: 'u', value: serialUrl },
        { code: 'y', value: 'Linkki verkkoaineistoon' },
      ],
    },
  ];
}

export function generate935(publicationInfo: CreateMarcRecordInformation): DataField[] {
  const { isSerial } = publicationInfo;

  if (!isSerial) {
    return [];
  }

  const date = new Date();
  const luxonDate = DateTime.fromJSDate(date); // Using Luxon for date formatting purposes: two-digit year and week number are required

  const dateDefinition = luxonDate.toFormat('WWyy');

  return [
    {
      tag: '935',
      subfields: [
        { code: 'a', value: `ISSNpre${dateDefinition}` },
        { code: '5', value: 'FENNI' },
      ],
    },
  ];
}

export function generateLOW(): DataField[] {
  return [
    {
      tag: 'LOW',
      subfields: [{ code: 'a', value: 'FIKKA' }],
    },
  ];
}
