import { Workbook } from 'exceljs';
import { sql } from 'kysely';

import { getKysely } from '../../db/database.ts';

import {
  ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_IDENTIFIERS,
} from '../../constants.ts';

import { getIsbnRanges } from './isbn-range-interface.ts';
import { getIsmnRanges } from './ismn-range-interface.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';
import type { MonographPublisherContactPerson } from '../../db/types/monograph/types-monograph-publisher.ts';

interface MonthlyStatistics {
  year: number;
  month: number;
  count: number;
}

export function formatStatisticsToWorkbook(statisticsName: string, data: Record<string, string>[]): Workbook {
  const workbook = new Workbook();
  workbook.creator = 'National Library of Finland';

  const sheet = workbook.addWorksheet(statisticsName);

  const [firstRow] = data;

  if (!firstRow) {
    throw new Error('Could not format statistics data as it did not include any row information');
  }

  // Add headers from object keys
  // It is expected all records share the object keys
  const headers = Object.keys(firstRow);
  sheet.columns = headers.map((h) => ({ header: h, key: h })); // Note: key needs to be explicitly defined -> it is not implicitly placed equal to header if undefined!

  // Add rows by utilizing key-value insert
  data.forEach((d) => sheet.addRow(d));

  // Note: workbook is returned here so that controller may decide correct writeBuffer while writing content related headers
  return workbook;
}

// TODO: integration test data
export async function getMonthlyMonographStatistics(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  begin: Date,
  endExclusive: Date,
): Promise<Record<string, string>[]> {
  const startMonth = begin.getMonth() + 1;
  const startYear = begin.getFullYear();

  const endMonth = endExclusive.getMonth() + 1;
  const endYear = endExclusive.getFullYear();

  const years = [...Array(endYear - startYear + 1).keys()].map((v) => v + startYear);

  // 1. Construct headers and initialize rows:
  //   - First column is type of statistics
  //   - Each month between start and end constructs `${month} / ${year}` column
  const headers = ['Tilaston tyyppi'];
  const rows: Record<string, string>[] = [];

  years.forEach((year) => {
    [...Array(12).keys()]
      .map((v) => v + 1) //
      .forEach((month) => {
        if (year === startYear && month < startMonth) {
          return;
        }

        if (year === endYear && month > endMonth) {
          return;
        }

        headers.push(`${month} / ${year}`);
        return;
      });
  });

  // 2. Retrieve statistics

  // Sent messages count
  const sentMessages: MonthlyStatistics[] = await getNumSendMessages(begin, endExclusive);
  rows.push(formatResultSet('Lähetetyt viestit', sentMessages, headers));

  // Created ISBN publisher ranges count
  const createdIsbnPublisherRanges: MonthlyStatistics[] = await getCreatedIsbnPublisherIdentifierCount(
    begin,
    endExclusive,
  );
  rows.push(formatResultSet('Uudet ISBN-kustantajatunnukset', createdIsbnPublisherRanges, headers));

  // Created ISMN publisher ranges count
  const createdIsmnPublisherRanges: MonthlyStatistics[] = await getCreatedIsmnPublisherIdentifierCount(
    begin,
    endExclusive,
  );
  rows.push(formatResultSet('Uudet ISMN-kustantajatunnukset', createdIsmnPublisherRanges, headers));

  // Created publisher requests
  const createdPublisherRequests: MonthlyStatistics[] = await getCreatedMonographPublisherRequestCount(
    begin,
    endExclusive,
  );
  rows.push(formatResultSet('Kustantajarekisterin liittymislomakkeet', createdPublisherRequests, headers));

  // Publication requests (ISMN)
  const createdPublicationRequestsIsmn: MonthlyStatistics[] = await getCreatedMonographPublicationRequestCount(
    begin,
    endExclusive,
    true,
  );
  rows.push(formatResultSet('ISMN hakulomakkeet', createdPublicationRequestsIsmn, headers));

  // Publication requests (ISBN)
  const createdPublicationRequestsIsbn: MonthlyStatistics[] = await getCreatedMonographPublicationRequestCount(
    begin,
    endExclusive,
    false,
  );
  rows.push(formatResultSet('ISBN hakulomakkeet', createdPublicationRequestsIsbn, headers));

  // Assigned ISBN identifier (self-publishing)
  const authorPublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    begin,
    endExclusive,
    monographPublisherConfiguration.SELF_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (omakustanteet)', authorPublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (state publisher)
  const statePublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    begin,
    endExclusive,
    monographPublisherConfiguration.STATE_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (valtio)', statePublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (HY publisher)
  const helsinkiUniPublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    begin,
    endExclusive,
    monographPublisherConfiguration.HY_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (yliopisto)', helsinkiUniPublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (small publishers)
  const cat5AssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(begin, endExclusive, null, true);
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (5-merkkiset)', cat5AssignedIsbn, headers));

  // Assigned ISMN identifier (self-publishing)
  const authorPublisherAssignedIsmn: MonthlyStatistics[] = await getAssignedIsmnIdentifierCount(
    begin,
    endExclusive,
    monographPublisherConfiguration.SELF_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISMN-tunnukset (omakustanteet)', authorPublisherAssignedIsmn, headers));

  // Assigned ISBN identifier (small publishers)
  const cat7AssignedIsmn: MonthlyStatistics[] = await getAssignedIsmnIdentifierCount(begin, endExclusive, null, true);
  rows.push(formatResultSet('Myönnetyt ISMN-tunnukset (7-merkkiset)', cat7AssignedIsmn, headers));

  // Count of publishers modified
  const modifiedPublishers: MonthlyStatistics[] = await getModifiedMonographPublisherCount(begin, endExclusive);
  rows.push(formatResultSet('Kustantajatietojen muokkaukset', modifiedPublishers, headers));

  return rows;

  function formatResultSet(
    statisticsTypeName: string,
    resultSet: MonthlyStatistics[],
    headers: string[],
  ): Record<string, string> {
    // Initialize result by defining value of zero to all headers
    const result: Record<string, string> = headers.reduce((p, n) => ({ ...p, [n]: '0' }), {});

    // Add statistics type name
    result['Tilaston tyyppi'] = statisticsTypeName;

    // Overwrite zeroes with result set values
    resultSet.forEach(({ year, month, count }) => {
      const monthKey = `${month} / ${year}`;
      result[monthKey] = `${count}`;
    });

    return result;
  }
}

export async function getNumSendMessages(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('monograph_message')
    .select([
      sql<number>`YEAR(sent)`.as('year'),
      sql<number>`MONTH(sent)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('sent', '>=', begin)
    .where('sent', '<', endExclusive)
    .groupBy([sql`YEAR(sent)`, sql`MONTH(sent)`])
    .orderBy(sql`YEAR(sent)`)
    .orderBy(sql`MONTH(sent)`)
    .execute();
}

export async function getCreatedIsbnPublisherIdentifierCount(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('isbn_publisher_range')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy(sql`YEAR(created)`)
    .orderBy(sql`MONTH(created)`)
    .execute();
}

export async function getCreatedIsmnPublisherIdentifierCount(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('ismn_publisher_range')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy(sql`YEAR(created)`)
    .orderBy(sql`MONTH(created)`)
    .execute();
}

// Note: this correctly applies only for data created after API v2 has entered production as creation date before v2 is derived from request creation date
export async function getCreatedMonographPublisherCount(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('monograph_publisher')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy(sql`YEAR(created)`)
    .orderBy(sql`MONTH(created)`)
    .execute();
}

// Note: this count is problematic. For example if publisher is first modified 01/2025 and then later at 07/2025.
// The count is dependent on the time of fetching the information.
export async function getModifiedMonographPublisherCount(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('monograph_publisher')
    .select([
      sql<number>`YEAR(modified)`.as('year'),
      sql<number>`MONTH(modified)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('modified', '>=', begin)
    .where('modified', '<', endExclusive)
    .groupBy([sql`YEAR(modified)`, sql`MONTH(modified)`])
    .orderBy(sql`YEAR(modified)`)
    .orderBy(sql`MONTH(modified)`)
    .execute();
}

export async function getAssignedIsbnIdentifierCount(
  begin: Date,
  endExclusive: Date,
  publisherId: number | null,
  cat5Only?: boolean,
) {
  const db = getKysely();

  let query = db
    .selectFrom('isbn_identifier')
    .leftJoin('isbn_publisher_range', 'isbn_publisher_range.id', 'isbn_identifier.isbn_publisher_range_id')
    .select([
      sql<number>`YEAR(isbn_identifier.modified)`.as('year'),
      sql<number>`MONTH(isbn_identifier.modified)`.as('month'),
      (eb) => eb.fn.count<number>('isbn_identifier.id').distinct().as('count'),
    ])
    .where('isbn_identifier.modified', '>=', begin)
    .where('isbn_identifier.modified', '<', endExclusive)
    .where('isbn_identifier.monograph_publication_manifestation_id', 'is not', null);

  if (publisherId !== null) {
    query = query.where('isbn_publisher_range.monograph_publisher_id', '=', publisherId);
  } else if (cat5Only) {
    query = query.where(
      sql<number>`LENGTH(isbn_publisher_range.publisher_identifier)`,
      '=',
      // @ts-expect-error TS expects category is not defined
      ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH['5'],
    );
  }

  return await query
    .groupBy([sql`YEAR(isbn_identifier.modified)`, sql`MONTH(isbn_identifier.modified)`])
    .orderBy(sql`YEAR(isbn_identifier.modified)`)
    .orderBy(sql`MONTH(isbn_identifier.modified)`)
    .execute();
}

export async function getAssignedIsmnIdentifierCount(
  begin: Date,
  endExclusive: Date,
  publisherId: number | null,
  cat7Only?: boolean,
) {
  const db = getKysely();

  let query = db
    .selectFrom('ismn_identifier')
    .leftJoin('ismn_publisher_range', 'ismn_publisher_range.id', 'ismn_identifier.ismn_publisher_range_id')
    .select([
      sql<number>`YEAR(ismn_identifier.modified)`.as('year'),
      sql<number>`MONTH(ismn_identifier.modified)`.as('month'),
      (eb) => eb.fn.count<number>('ismn_identifier.id').distinct().as('count'),
    ])
    .where('ismn_identifier.modified', '>=', begin)
    .where('ismn_identifier.modified', '<', endExclusive)
    .where('ismn_identifier.monograph_publication_manifestation_id', 'is not', null);

  if (publisherId !== null) {
    query = query.where('ismn_publisher_range.monograph_publisher_id', '=', publisherId);
  } else if (cat7Only) {
    query = query.where(
      sql<number>`LENGTH(ismn_publisher_range.publisher_identifier)`,
      '=',
      // @ts-expect-error TS expects category is not defined
      ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH['7'],
    );
  }

  return await query
    .groupBy([sql`YEAR(ismn_identifier.modified)`, sql`MONTH(ismn_identifier.modified)`])
    .orderBy(sql`YEAR(ismn_identifier.modified)`)
    .orderBy(sql`MONTH(ismn_identifier.modified)`)
    .execute();
}

// Note: this misses rejected requests as they are removed from archive during rejection process
export async function getCreatedMonographPublisherRequestCount(begin: Date, endExclusive: Date) {
  const db = getKysely();

  return await db
    .selectFrom('monograph_publisher_request_archive')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy(sql`YEAR(created)`)
    .orderBy(sql`MONTH(created)`)
    .execute();
}

// Note: this misses rejected requests as they are removed during rejection process
export async function getCreatedMonographPublicationRequestCount(
  begin: Date,
  endExclusive: Date,
  sheetMusic: boolean | null,
) {
  const db = getKysely();

  let query = db
    .selectFrom('monograph_publication_request')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      db.fn.countAll<number>().as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive);

  // Filter if calculating only request where expression is sheet music -> results into manifestations having ISMN identifiers
  if (sheetMusic === true) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('monograph_publication_expression')
          .select('monograph_publication_expression.id')
          .whereRef(
            'monograph_publication_expression.monograph_publication_id',
            '=',
            'monograph_publication_request.monograph_publication_id',
          )
          .where('monograph_publication_expression.expression_type', '=', MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC),
      ),
    );
  }

  // Filter if calculating only request where expression is not sheet music -> results into manifestations having ISBN identifiers
  if (sheetMusic === false) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('monograph_publication_expression')
          .select('monograph_publication_expression.id')
          .whereRef(
            'monograph_publication_expression.monograph_publication_id',
            '=',
            'monograph_publication_request.monograph_publication_id',
          )
          .where('monograph_publication_expression.expression_type', '!=', MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC),
      ),
    );
  }

  return await query
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy(sql`YEAR(created)`)
    .orderBy(sql`MONTH(created)`)
    .execute();
}

export async function getIsbnRangeProgress(): Promise<Record<string, string>[]> {
  const isbnRanges = await getIsbnRanges();
  return isbnRanges.map((isbnRange) => ({
    etuliite: isbnRange.gs1,
    kieliryhmä: isbnRange.registration_group,
    alku: isbnRange.range_begin,
    loppu: isbnRange.range_end,
    vapaana: String(isbnRange.free),
    käytetty: String(isbnRange.taken),
  }));
}

export async function getIsmnRangeProgress(): Promise<Record<string, string>[]> {
  const ismnRanges = await getIsmnRanges();
  return ismnRanges.map((ismnRange) => ({
    etuliite: `${ismnRange.gs1}-${ismnRange.registration_group}`,
    alku: ismnRange.range_begin,
    loppu: ismnRange.range_end,
    vapaana: String(ismnRange.free),
    käytetty: String(ismnRange.taken),
  }));
}

export async function getSelfPublisherPublicationStatistics(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  begin: Date,
  endExclusive: Date,
  identifierType: 'ISBN' | 'ISMN',
) {
  const db = getKysely();

  // In future it's worth checking if optimization is required for this query
  // For now, let API process do filtering instead of DB query regarding identifier type
  const authorPublisherPublicationRequests = await db
    .selectFrom('monograph_publication_request')
    .selectAll()
    .where(
      'monograph_publication_request.monograph_publisher_id',
      '=',
      monographPublisherConfiguration.SELF_PUBLISHER_ID,
    )
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .execute();

  const publications = await Promise.all(
    authorPublisherPublicationRequests.map(async (pr) => await readMonographPublication(pr.monograph_publication_id)),
  );

  const filteredPublications = publications.filter((publication) => {
    const hasIsbn = publication.expressions.some((expression) =>
      expression.manifestations.some((manifestation) => manifestation.isbn_identifier),
    );
    const hasIsmn = publication.expressions.some((expression) =>
      expression.manifestations.some((manifestation) => manifestation.ismn_identifier),
    );

    if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
      return hasIsbn;
    }

    // Implicit else if for ISMN that relies on type checking
    return hasIsmn;
  });

  // The end of this function is a bit cryptic so here is a human-readable description of it:
  // - For each relevant publication associated with publication request:
  //   -> Iterate over all expressions
  //     -> Iterate over all manifestations for each expression
  //       -> Construct an entry regarding given identifier
  //
  // In end of iterative loops flatten the resulting 2d array. This will result to one-dimensional array at the end which is compatible with XLSX/CSV workbook constructor.
  return filteredPublications
    .map((publication) => {
      const publicationRequest = authorPublisherPublicationRequests.find(
        (pr) => pr.monograph_publication_id === publication.id,
      );
      if (!publicationRequest) {
        throw new Error('Unexpected error occurred. Custom error code: STATISTICS-01.');
      }

      return publication.expressions
        .map((expression) =>
          expression.manifestations.map((manifestation) => ({
            Registrant_Status_Code: manifestation.cancelled ? 'I' : 'A',
            Registrant_Prefix_Type: 'A',
            [`Registrant_Prefix_Or_${identifierType}`]:
              identifierType === MONOGRAPH_IDENTIFIERS.ISBN
                ? manifestation.isbn_identifier || ''
                : manifestation.ismn_identifier || '',
            Registrant_Name: publicationRequest.official_name,
            ISO_Country_Code: 'FI',
            Address_Line_1: publicationRequest.address || '',
            Address_Line_2:
              publicationRequest.zip && publicationRequest.city
                ? `${publicationRequest.zip} ${publicationRequest.city}`
                : '',
            Address_Line_3: '',
            Address_Line_4: '',
            Admin_Contact_Name: publicationRequest.contact_person || '',
            Admin_Phone: publicationRequest.phone || '',
            Admin_Fax: '',
            Admin_Email: publicationRequest.email || '',
            Alternate_Contact_Type: '',
            Alternate_Contact_Name: '',
            Alternate_Phone: '',
            Alternate_Fax: '',
            Alternate_Email: '',
            SAN: '',
            GLN: '',
            Website_URL: '',
            Registrant_ID: '',
            ISNI: '',
          })),
        )
        .flat();
    })
    .flat();
}

// i.e., publishers whose first publisher identifier of given type has been created during given time period
export async function getInitialPublisherIdentifierStatistics(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  begin: Date,
  endExclusive: Date,
  identifierType: 'ISBN' | 'ISMN',
) {
  const db = getKysely();
  let publisherInfo: Record<string, string>[] = [];

  if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
    const isbnPublisherInfo = await db
      .selectFrom('monograph_publisher as P')
      .innerJoin('isbn_publisher_range as IPR', 'IPR.monograph_publisher_id', 'P.id')
      .selectAll('P')
      .select(['IPR.publisher_identifier as first_isbn_publisher_identifier'])
      .where(
        'IPR.id',
        'in',
        db
          .selectFrom('isbn_publisher_range')
          .select((eb) => eb.fn.min('id').as('minId'))
          .groupBy('monograph_publisher_id'),
      )
      .where('IPR.created', '>=', begin)
      .where('IPR.created', '<', endExclusive)
      .orderBy('P.official_name')
      .execute();

    publisherInfo = isbnPublisherInfo.map((p) =>
      formatPublisherData(
        monographPublisherConfiguration,
        MONOGRAPH_IDENTIFIERS.ISBN,
        p,
        p.first_isbn_publisher_identifier,
      ),
    );
  } else if (identifierType === MONOGRAPH_IDENTIFIERS.ISMN) {
    const ismnPublisherInfo = await db
      .selectFrom('monograph_publisher as P')
      .innerJoin('ismn_publisher_range as IPR', 'IPR.monograph_publisher_id', 'P.id')
      .selectAll('P')
      .select(['IPR.publisher_identifier as first_ismn_publisher_identifier'])
      .where(
        'IPR.id',
        'in',
        db
          .selectFrom('ismn_publisher_range')
          .select((eb) => eb.fn.min('id').as('minId'))
          .groupBy('monograph_publisher_id'),
      )
      .where('IPR.created', '>=', begin)
      .where('IPR.created', '<', endExclusive)
      .orderBy('P.official_name')
      .execute();

    publisherInfo = ismnPublisherInfo.map((p) =>
      formatPublisherData(
        monographPublisherConfiguration,
        MONOGRAPH_IDENTIFIERS.ISMN,
        p,
        p.first_ismn_publisher_identifier,
      ),
    );
  }

  return publisherInfo;
}

export async function getPublisherIdentifierStatistics(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  begin: Date,
  endExclusive: Date,
  identifierType: 'ISBN' | 'ISMN',
) {
  const db = getKysely();
  let publisherInfo: Record<string, string>[] = [];

  // Again a bit difficult portion of code:
  // 1. Find all publisher ranges created between given time period
  // 2. Join publisher information to result set
  // 3. For each range write a set of entries
  //   -> Each set of entries contains main entry from official name AND
  //   -> An entry per each name defined in previous_name array
  // 4. Flatten result set

  if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
    const isbnPublisherRangeInfo = await db
      .selectFrom('isbn_publisher_range as IPR')
      .leftJoin('monograph_publisher as P', 'P.id', 'IPR.monograph_publisher_id')
      .select([
        'P.id as publisherId',
        'P.official_name as publisherName',
        'P.previous_names as publisherPreviousNames',
        'P.address as publisherAddress',
        'P.zip as publisherZip',
        'P.city as publisherCity',
        'P.phone as publisherPhone',
        'P.email as publisherEmail',
        'P.www as publisherWww',
        'P.contact_persons as publisherContacts',
        'P.has_quitted as publisherHasQuitted',
      ])
      .select(['IPR.publisher_identifier as isbn_publisher_identifier'])
      .where('IPR.created', '>=', begin)
      .where('IPR.created', '<', endExclusive)
      .orderBy('P.official_name')
      .execute();

    publisherInfo = isbnPublisherRangeInfo
      .map((pr) => {
        const publisherToFormat = {
          id: pr.publisherId,
          official_name: pr.publisherName,
          address: pr.publisherAddress,
          zip: pr.publisherZip,
          city: pr.publisherCity,
          phone: pr.publisherPhone,
          email: pr.publisherEmail,
          www: pr.publisherWww,
          contact_persons: pr.publisherContacts,
          has_quitted: pr.publisherHasQuitted,
        };

        if (!publisherToFormat.id || !publisherToFormat.official_name || !pr.publisherPreviousNames) {
          throw new Error('Unexpected data error on formatting publisher');
        }

        const mainEntry = formatPublisherData(
          monographPublisherConfiguration,
          MONOGRAPH_IDENTIFIERS.ISBN,
          // @ts-expect-error TS does not understand sanity check for id and official_name
          publisherToFormat,
          pr.isbn_publisher_identifier,
        );

        const previousNameEntries = pr.publisherPreviousNames.map((previousName) =>
          formatPublisherData(
            monographPublisherConfiguration,
            MONOGRAPH_IDENTIFIERS.ISBN,
            // @ts-expect-error TS does not understand sanity check for id and official_name
            publisherToFormat,
            pr.isbn_publisher_identifier,
            previousName,
          ),
        );

        return [mainEntry].concat(previousNameEntries).flat();
      })
      .flat();
  } else if (identifierType === MONOGRAPH_IDENTIFIERS.ISMN) {
    const ismnPublisherRangeInfo = await db
      .selectFrom('ismn_publisher_range as IPR')
      .leftJoin('monograph_publisher as P', 'P.id', 'IPR.monograph_publisher_id')
      .select([
        'P.id as publisherId',
        'P.official_name as publisherName',
        'P.previous_names as publisherPreviousNames',
        'P.address as publisherAddress',
        'P.zip as publisherZip',
        'P.city as publisherCity',
        'P.phone as publisherPhone',
        'P.email as publisherEmail',
        'P.www as publisherWww',
        'P.contact_persons as publisherContacts',
        'P.has_quitted as publisherHasQuitted',
      ])
      .select(['IPR.publisher_identifier as ismn_publisher_identifier'])
      .where('IPR.created', '>=', begin)
      .where('IPR.created', '<', endExclusive)
      .orderBy('P.official_name')
      .execute();

    publisherInfo = ismnPublisherRangeInfo
      .map((pr) => {
        const publisherToFormat = {
          id: pr.publisherId,
          official_name: pr.publisherName,
          address: pr.publisherAddress,
          zip: pr.publisherZip,
          city: pr.publisherCity,
          phone: pr.publisherPhone,
          email: pr.publisherEmail,
          www: pr.publisherWww,
          contact_persons: pr.publisherContacts,
          has_quitted: pr.publisherHasQuitted,
        };

        if (!publisherToFormat.id || !publisherToFormat.official_name || !pr.publisherPreviousNames) {
          throw new Error('Unexpected data error on formatting publisher');
        }

        const mainEntry = formatPublisherData(
          monographPublisherConfiguration,
          MONOGRAPH_IDENTIFIERS.ISMN,
          // @ts-expect-error TS does not understand sanity check for id and official_name
          publisherToFormat,
          pr.ismn_publisher_identifier,
        );

        const previousNameEntries = pr.publisherPreviousNames.map((previousName) =>
          formatPublisherData(
            monographPublisherConfiguration,
            MONOGRAPH_IDENTIFIERS.ISMN,
            // @ts-expect-error TS does not understand sanity check for id and official_name
            publisherToFormat,
            pr.ismn_publisher_identifier,
            previousName,
          ),
        );

        return [mainEntry].concat(previousNameEntries).flat();
      })
      .flat();
  }

  return publisherInfo;
}

interface PublisherInformation {
  id: number;
  official_name: string;
  address: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  www: string | null;
  contact_persons: MonographPublisherContactPerson[];
  has_quitted: boolean;
}

export function formatPublisherData(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  identifierType: 'ISBN' | 'ISMN',
  publisher: PublisherInformation,
  publisherIdentifier: string,
  overwriteName?: string,
): Record<string, string> {
  return {
    Registrant_Status_Code: publisher.has_quitted || overwriteName ? 'I' : 'A',
    Registrant_Prefix_Type: publisher.id === monographPublisherConfiguration.SELF_PUBLISHER_ID ? 'T' : 'P',
    [`Registrant_Prefix_Or_${identifierType}`]: publisherIdentifier,
    Registrant_Name: overwriteName ? overwriteName : publisher.official_name,
    ISO_Country_Code: 'FI',
    Address_Line_1: publisher.address || '',
    Address_Line_2: publisher.zip && publisher.city ? `${publisher.zip} ${publisher.city}` : '',
    Address_Line_3: '',
    Address_Line_4: '',
    // @ts-expect-error TS does not understand array length check
    Admin_Contact_Name: publisher.contact_persons.length > 0 ? publisher.contact_persons[0].name : '',
    Admin_Phone: publisher.phone || '',
    Admin_Fax: '',
    Admin_Email: publisher.email || '',
    Alternate_Contact_Type: '',
    Alternate_Contact_Name: '',
    Alternate_Phone: '',
    Alternate_Fax: '',
    Alternate_Email: '',
    SAN: '',
    GLN: '',
    Website_URL: publisher.www || '',
    Registrant_ID: '',
    ISNI: '',
  };
}
