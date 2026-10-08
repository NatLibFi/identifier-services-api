import HttpStatus from 'http-status';

import { SERIAL_STATISTIC_TYPE } from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import {
  getIssnStatistics,
  getSerialPublicationRequestStatistics,
  getSerialPublicationStatistics,
  getSerialPublisherStatistics,
} from './serial-statistics-interface-utils.ts';

import {
  formatStatisticsToWorkbook,
  type StatisticsWorksheetInfo,
} from '../monograph/monograph-statistics-interface-utils.ts';

import type { CreateSerialStatisticsHttp } from '../../validations/serial/serial-statistics-validation.ts';

export async function createSerialStatistics(statisticsOpts: CreateSerialStatisticsHttp) {
  const { statistics_type, begin, end } = statisticsOpts;

  // "end" is always made exclusive to avoid timestamp problems and allow utilizing '<' condition
  const statisticsBegin = begin ? new Date(begin) : new Date('1970-01-01');
  const statisticsEnd = end ? new Date(end) : new Date();

  statisticsEnd.setHours(0, 0, 0, 0);
  statisticsEnd.setDate(statisticsEnd.getDate() + 1);

  // Note:
  //   - ISSN range statistics is currently the only one that constructs multiple worksheets to a workbook and thus is returned separately
  //   - CSV transformation only provides the first sheet information when workbook has multiple sheets

  let data: Record<string, string>[];

  if (statistics_type === SERIAL_STATISTIC_TYPE.ISSN) {
    const data = await getIssnStatistics(statisticsBegin, statisticsEnd);
    return formatStatisticsToWorkbook(data);
    // TODO: tests
  } else if (statistics_type === SERIAL_STATISTIC_TYPE.PUBLISHERS) {
    data = await getSerialPublisherStatistics(statisticsBegin, statisticsEnd);
  } else if (statistics_type === SERIAL_STATISTIC_TYPE.PUBLICATIONS) {
    data = await getSerialPublicationStatistics(statisticsBegin, statisticsEnd);
  } else if (statistics_type === SERIAL_STATISTIC_TYPE.FORMS) {
    data = await getSerialPublicationRequestStatistics(statisticsBegin, statisticsEnd);
  } else {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Statistics type of ${statistics_type} is not yet supported`,
    );
  }

  const worksheet: StatisticsWorksheetInfo = {
    statisticsName: statistics_type,
    data,
  };

  return formatStatisticsToWorkbook([worksheet]);
}
