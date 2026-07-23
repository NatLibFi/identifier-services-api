import HttpStatus from 'http-status';

import { MONOGRAPH_STATISTIC_TYPE } from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import { formatStatisticsToWorkbook, getMonthlyMonographStatistics } from './monograph-statistics-interface-utils.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';
import type { CreateMonographStatisticsHttp } from '../../validations/monograph/monograph-statistics-validation.ts';

// Note: interface is created using returned function due to need to have configuration separate from config.ts for integration testing purposes
export default function createMonographStatisticsInterface(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  async function createMonographStatistics(statisticsOpts: CreateMonographStatisticsHttp) {
    const { statistics_type, begin, end } = statisticsOpts;

    if (statistics_type === MONOGRAPH_STATISTIC_TYPE.MONTHLY) {
      const data = await getMonthlyMonographStatistics(monographPublisherConfiguration, begin, end);
      return formatStatisticsToWorkbook(MONOGRAPH_STATISTIC_TYPE.MONTHLY, data);
    }

    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Statistics type of ${statistics_type} is not yet supported`,
    );
  }

  return {
    createMonographStatistics,
  };
}
