import { sql } from 'kysely';

import { getIssnRanges } from './issn-range-interface.ts';
import { getKysely } from '../../db/database.ts';

import type { MonthlyStatistics, StatisticsWorksheetInfo } from '../monograph/monograph-statistics-interface-utils.ts';
import { SERIAL_PUBLICATION_STATUS } from '../../constants.ts';

export async function getIssnStatistics(begin: Date, endExclusive: Date): Promise<StatisticsWorksheetInfo[]> {
  const issnRanges = await getIssnRanges();
  const firstSheetData = issnRanges.map((r) => ({
    Lohko: r.block,
    Annettu: String(r.taken),
    Vapaana: String(r.free),
    'Yht.': String(r.free + r.taken),
  }));

  const firstSheet: StatisticsWorksheetInfo = {
    statisticsName: 'ISSN-lohkot',
    data: firstSheetData,
  };

  const secondSheetData = await getIssnRangeMonthlyStatistics(begin, endExclusive);
  const formattedSecondSheetData = secondSheetData.map((result) => ({
    Kuukausi: `${String(result.month).padStart(2, '0')}/${result.year}`,
    Lohko: result.block,
    Lukumäärä: String(result.count),
  }));

  const secondSheet: StatisticsWorksheetInfo = {
    statisticsName: 'Jaetut ISSN-tunnukset',
    data: formattedSecondSheetData,
  };

  return [firstSheet, secondSheet];
}

// Note: assumes that only modification done for issn_identifier is assignation and that this alters modification timestamp
export async function getIssnRangeMonthlyStatistics(begin: Date, endExclusive: Date) {
  const db = getKysely();

  const result = await db
    .selectFrom('issn_range as IR')
    .innerJoin('issn_identifier as I', 'I.issn_range_id', 'IR.id')
    .select([
      sql<number>`YEAR(I.modified)`.as('year'),
      sql<number>`MONTH(I.modified)`.as('month'),
      'IR.block as block',
      sql<number>`COUNT(DISTINCT I.id)`.as('count'),
    ])
    .where('I.serial_publication_id', 'is not', null)
    .where('I.modified', '>=', begin)
    .where('I.modified', '<', endExclusive)
    .groupBy([sql`YEAR(I.modified)`, sql`MONTH(I.modified)`, 'IR.block'])
    .orderBy('year')
    .orderBy('month')
    .orderBy('IR.block')
    .execute();

  return result;
}

// Returns array of strings representing months between begin and end in format of: `<zero-padded month>/year`
export function getMonthlyStatColumns(begin: Date, endExclusive: Date) {
  const startMonth = begin.getMonth() + 1;
  const startYear = begin.getFullYear();

  const endMonth = endExclusive.getMonth();
  const endYear = endExclusive.getFullYear();

  const results: string[] = [];

  const years = [...Array(endYear - startYear + 1).keys()].map((v) => v + startYear);

  // Loop through years and months, add headers in date range to result
  years.forEach((year) => {
    [...Array(12).keys()]
      .map((v) => v + 1)
      .forEach((month) => {
        if (year === startYear && month < startMonth) {
          return;
        }

        if (year === endYear && month > endMonth) {
          return;
        }

        results.push(`${String(month).padStart(2, '0')}/${year}`);
        return;
      });
  });

  return results;
}

// Finds count for given month. If not found, returns zero.
// Expects monthString format of "<zero-padded month>/<year>"
export function findMatchingMonthlyEntry(monthString: string, data: MonthlyStatistics[]): number {
  // Expect using delimiter of '/'
  const [month, year] = monthString.split('/');

  if (!month || !year) {
    throw new Error(`Could not parse month and/or year information from statistics string of "${monthString}"`);
  }

  const monthNumber = Number(month.replace(/^0/, ''));
  const yearNumber = Number(year);

  if (isNaN(monthNumber) || isNaN(yearNumber) || monthNumber > 12 || monthNumber < 1) {
    throw new Error(`Could not parse numeric month and/or year information from statistics string of "${monthString}"`);
  }

  const matchingDataEntry = data.find((dataEntry) => dataEntry.month === monthNumber && dataEntry.year === yearNumber);
  if (!matchingDataEntry) {
    return 0;
  }

  return matchingDataEntry.count;
}

export async function getSerialPublisherStatistics(begin: Date, endExclusive: Date) {
  const db = getKysely();

  // Date columns are used as keys which will transform into headers
  const typeColumn = 'Aktiviteetin tyyppi';
  const dateColumns = getMonthlyStatColumns(begin, endExclusive);

  // Serial publishers created
  const publishersCreatedResult = await db
    .selectFrom('serial_publisher')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      sql<number>`COUNT(DISTINCT id)`.as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy('year')
    .orderBy('month')
    .execute();

  const publishersCreatedDataRowInit = { [typeColumn]: 'Luotu' };
  const publishersCreatedDataRow: Record<string, string> = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, publishersCreatedResult) }),
    publishersCreatedDataRowInit,
  );

  // Serial publishers modified (note: this entry value will not be available historically -> a separate statistics table containing modification timestamps would be required)
  const publishersModifiedResult = await db
    .selectFrom('serial_publisher')
    .select([
      sql<number>`YEAR(modified)`.as('year'),
      sql<number>`MONTH(modified)`.as('month'),
      sql<number>`COUNT(DISTINCT id)`.as('count'),
    ])
    .where('modified', '>=', begin)
    .where('modified', '<', endExclusive)
    .groupBy([sql`YEAR(modified)`, sql`MONTH(modified)`])
    .orderBy('year')
    .orderBy('month')
    .execute();

  const publishersModifiedDataRowInit = { [typeColumn]: 'Muokattu' };
  const publishersModifiedDataRow: Record<string, string> = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, publishersModifiedResult) }),
    publishersModifiedDataRowInit,
  );

  return [publishersCreatedDataRow, publishersModifiedDataRow];
}

// Get number of serial publication entries where created-timestamp is between given dates per item current status
export async function getSerialPublicationStatistics(begin: Date, endExclusive: Date) {
  // Date columns are used as keys which will transform into headers
  const statusColumn = 'Julkaisun tila';
  const dateColumns = getMonthlyStatColumns(begin, endExclusive);

  // Status: no prepublication record
  const noPrepublicationRecordDbResult = await getSerialPublicationCreatedStatisticsByStatus(
    begin,
    endExclusive,
    SERIAL_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD,
  );
  const noPrepublicationRecordInit = { [statusColumn]: 'Ei ennakkotietoa' };
  const noPrepublicationRecordData = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, noPrepublicationRecordDbResult) }),
    noPrepublicationRecordInit,
  );

  // Status: issn identifier frozen
  const frozenIdentifierDbResult = await getSerialPublicationCreatedStatisticsByStatus(
    begin,
    endExclusive,
    SERIAL_PUBLICATION_STATUS.ISSN_FROZEN,
  );
  const frozenIdentifierInit = { [statusColumn]: 'Jäädytetty' };
  const frozenIdentifierData = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, frozenIdentifierDbResult) }),
    frozenIdentifierInit,
  );

  // Status: waiting for control copy
  const waitingForControlCopyDbResult = await getSerialPublicationCreatedStatisticsByStatus(
    begin,
    endExclusive,
    SERIAL_PUBLICATION_STATUS.WAITING_FOR_CONTROL_COPY,
  );
  const waitingForControlCopyInit = { [statusColumn]: 'Odottaa valvontakpl' };
  const waitingForControlCopyData = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, waitingForControlCopyDbResult) }),
    waitingForControlCopyInit,
  );

  // Status: completed
  const completedDbResult = await getSerialPublicationCreatedStatisticsByStatus(
    begin,
    endExclusive,
    SERIAL_PUBLICATION_STATUS.COMPLETED,
  );
  const completedInit = { [statusColumn]: 'Valmis' };
  const completedData = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, completedDbResult) }),
    completedInit,
  );

  return [noPrepublicationRecordData, frozenIdentifierData, waitingForControlCopyData, completedData];
}

export async function getSerialPublicationCreatedStatisticsByStatus(begin: Date, endExclusive: Date, status: string) {
  const db = getKysely();
  return await db
    .selectFrom('serial_publication')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      sql<number>`COUNT(DISTINCT id)`.as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .where('status', '=', status)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy('year')
    .orderBy('month')
    .execute();
}

export async function getSerialPublicationRequestStatistics(begin: Date, endExclusive: Date) {
  const dateColumns = getMonthlyStatColumns(begin, endExclusive);

  const db = getKysely();
  const dbResult = await db
    .selectFrom('serial_publication_request')
    .select([
      sql<number>`YEAR(created)`.as('year'),
      sql<number>`MONTH(created)`.as('month'),
      sql<number>`COUNT(DISTINCT id)`.as('count'),
    ])
    .where('created', '>=', begin)
    .where('created', '<', endExclusive)
    .groupBy([sql`YEAR(created)`, sql`MONTH(created)`])
    .orderBy('year')
    .orderBy('month')
    .execute();

  const statusColumn = 'Tilasto';
  const statisticsInit = { [statusColumn]: 'Luotuja lomakkeita' };
  const statisticsData = dateColumns.reduce(
    (p, n) => ({ ...p, [n]: findMatchingMonthlyEntry(n, dbResult) }),
    statisticsInit,
  );

  return [statisticsData];
}
