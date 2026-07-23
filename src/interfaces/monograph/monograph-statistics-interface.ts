import HttpStatus from 'http-status';

import { MONOGRAPH_IDENTIFIERS, MONOGRAPH_STATISTIC_TYPE } from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import {
  formatStatisticsToWorkbook,
  getInitialPublisherIdentifierStatistics,
  getIsbnRangeProgress,
  getIsmnRangeProgress,
  getMonthlyMonographStatistics,
  getSelfPublisherPublicationStatistics,
} from './monograph-statistics-interface-utils.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';
import type { CreateMonographStatisticsHttp } from '../../validations/monograph/monograph-statistics-validation.ts';

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createMonographStatisticsInterface(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  async function createMonographStatistics(statisticsOpts: CreateMonographStatisticsHttp) {
    const { statistics_type, begin, end } = statisticsOpts;

    // Note: ISBN/ISMN range progress does not utilize begin/end parameters and always return the current state
    // Also "end" is always made exclusive to avoid timestamp problems and allow utilizing '<' condition
    const statisticsBegin = begin ? new Date(begin) : new Date('1970-01-01');
    const statisticsEnd = end ? new Date(end) : new Date();

    statisticsEnd.setHours(0, 0, 0, 0);
    statisticsEnd.setDate(statisticsEnd.getDate() + 1);

    let data: Record<string, string>[] = [];

    if (statistics_type === MONOGRAPH_STATISTIC_TYPE.MONTHLY) {
      data = await getMonthlyMonographStatistics(monographPublisherConfiguration, statisticsBegin, statisticsEnd);
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PROGRESS_ISBN) {
      data = await getIsbnRangeProgress();
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PROGRESS_ISMN) {
      data = await getIsmnRangeProgress();
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PUBLICATIONS_ISBN) {
      data = await getSelfPublisherPublicationStatistics(
        monographPublisherConfiguration,
        statisticsBegin,
        statisticsEnd,
        MONOGRAPH_IDENTIFIERS.ISBN,
      );
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PUBLICATIONS_ISMN) {
      data = await getSelfPublisherPublicationStatistics(
        monographPublisherConfiguration,
        statisticsBegin,
        statisticsEnd,
        MONOGRAPH_IDENTIFIERS.ISMN,
      );
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PUBLISHERS_ISBN_INITIAL) {
      data = await getInitialPublisherIdentifierStatistics(
        monographPublisherConfiguration,
        statisticsBegin,
        statisticsEnd,
        MONOGRAPH_IDENTIFIERS.ISBN,
      );
    } else if (statistics_type === MONOGRAPH_STATISTIC_TYPE.PUBLISHERS_ISMN_INITIAL) {
      data = await getInitialPublisherIdentifierStatistics(
        monographPublisherConfiguration,
        statisticsBegin,
        statisticsEnd,
        MONOGRAPH_IDENTIFIERS.ISMN,
      );
    } else {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        `Statistics type of ${statistics_type} is not yet supported`,
      );
    }

    return formatStatisticsToWorkbook(statistics_type, data);
  }

  return {
    createMonographStatistics,
  };
}
