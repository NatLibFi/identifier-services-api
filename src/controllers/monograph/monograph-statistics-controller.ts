import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import { STATISTICS_FORMAT } from '../../constants.ts';
import { ApiError } from '../../utils/api-error.ts';

import createMonographStatisticsInterface from '../../interfaces/monograph/monograph-statistics-interface.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';
import type { CreateMonographStatisticsHttp } from '../../validations/monograph/monograph-statistics-validation.ts';

export default function createMonographStatisticsControllers(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  const monographStatisticsInterface = createMonographStatisticsInterface(monographPublisherConfiguration);

  async function createMonographStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { statistics_type, output_format }: CreateMonographStatisticsHttp = req.body;

      const result = await monographStatisticsInterface.createMonographStatistics(req.body);

      if (output_format === STATISTICS_FORMAT.CSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tunnisteportaali-${statistics_type}.csv"`);
        await result.csv.write(res);
        return res.status(HttpStatus.OK).end();
      }

      if (output_format === STATISTICS_FORMAT.XLSX) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="tunnisteportaali-${statistics_type}.xlsx"`);
        await result.csv.write(res);
        return res.status(HttpStatus.OK).end();
      }

      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        `Statistics output format ${output_format} is not currently supported.`,
      );
    } catch (error) {
      return next(error);
    }
  }

  return {
    createMonographStatistics,
  };
}
