import { Workbook } from 'exceljs';
import { sql } from 'kysely';
import { getKysely } from '../../db/database.ts';
import {
  ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  MONOGRAPH_EXPRESSION_TYPES,
} from '../../constants.ts';
import type { MonographPublisherConfiguration } from '../../app.ts';

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

export async function getMonthlyMonographStatistics(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  begin?: string,
  end?: string,
): Promise<Record<string, string>[]> {
  const statisticsBegin = begin ? new Date(begin) : new Date('1970-01-01');
  const statisticsEnd = end ? new Date(end) : new Date();

  // End is always exclusive to avoid timestamp problems
  statisticsEnd.setHours(0, 0, 0, 0);
  statisticsEnd.setDate(statisticsEnd.getDate() + 1);

  const startMonth = statisticsBegin.getMonth() + 1;
  const startYear = statisticsBegin.getFullYear();

  const endMonth = statisticsEnd.getMonth() + 1;
  const endYear = statisticsEnd.getFullYear();

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
  const sentMessages: MonthlyStatistics[] = await getNumSendMessages(statisticsBegin, statisticsEnd);
  rows.push(formatResultSet('Lähetetyt viestit', sentMessages, headers));

  // Created ISBN publisher ranges count
  const createdIsbnPublisherRanges: MonthlyStatistics[] = await getCreatedIsbnPublisherIdentifierCount(
    statisticsBegin,
    statisticsEnd,
  );
  rows.push(formatResultSet('Uudet ISBN-kustantajatunnukset', createdIsbnPublisherRanges, headers));

  // Created ISMN publisher ranges count
  const createdIsmnPublisherRanges: MonthlyStatistics[] = await getCreatedIsmnPublisherIdentifierCount(
    statisticsBegin,
    statisticsEnd,
  );
  rows.push(formatResultSet('Uudet ISMN-kustantajatunnukset', createdIsmnPublisherRanges, headers));

  // Created publisher requests
  const createdPublisherRequests: MonthlyStatistics[] = await getCreatedMonographPublisherRequestCount(
    statisticsBegin,
    statisticsEnd,
  );
  rows.push(formatResultSet('Kustantajarekisterin liittymislomakkeet', createdPublisherRequests, headers));

  // Publication requests (ISMN)
  const createdPublicationRequestsIsmn: MonthlyStatistics[] = await getCreatedMonographPublicationRequestCount(
    statisticsBegin,
    statisticsEnd,
    true,
  );
  rows.push(formatResultSet('ISMN hakulomakkeet', createdPublicationRequestsIsmn, headers));

  // Publication requests (ISBN)
  const createdPublicationRequestsIsbn: MonthlyStatistics[] = await getCreatedMonographPublicationRequestCount(
    statisticsBegin,
    statisticsEnd,
    false,
  );
  rows.push(formatResultSet('ISBN hakulomakkeet', createdPublicationRequestsIsbn, headers));

  // Assigned ISBN identifier (self-publishing)
  const authorPublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    monographPublisherConfiguration.SELF_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (omakustanteet)', authorPublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (state publisher)
  const statePublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    monographPublisherConfiguration.STATE_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (valtio)', statePublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (HY publisher)
  const helsinkiUniPublisherAssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    monographPublisherConfiguration.HY_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (yliopisto)', helsinkiUniPublisherAssignedIsbn, headers));

  // Assigned ISBN identifier (small publishers)
  const cat5AssignedIsbn: MonthlyStatistics[] = await getAssignedIsbnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    null,
    true,
  );
  rows.push(formatResultSet('Myönnetyt ISBN-tunnukset (5-merkkiset)', cat5AssignedIsbn, headers));

  // Assigned ISMN identifier (self-publishing)
  const authorPublisherAssignedIsmn: MonthlyStatistics[] = await getAssignedIsmnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    monographPublisherConfiguration.SELF_PUBLISHER_ID,
  );
  rows.push(formatResultSet('Myönnetyt ISMN-tunnukset (omakustanteet)', authorPublisherAssignedIsmn, headers));

  // Assigned ISBN identifier (small publishers)
  const cat7AssignedIsmn: MonthlyStatistics[] = await getAssignedIsmnIdentifierCount(
    statisticsBegin,
    statisticsEnd,
    null,
    true,
  );
  rows.push(formatResultSet('Myönnetyt ISMN-tunnukset (7-merkkiset)', cat7AssignedIsmn, headers));

  // Count of publishers modified
  const modifiedPublishers: MonthlyStatistics[] = await getModifiedMonographPublisherCount(
    statisticsBegin,
    statisticsEnd,
  );
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
