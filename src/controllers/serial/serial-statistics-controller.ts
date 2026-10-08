import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import { STATISTICS_FORMAT } from '../../constants.ts';
import { ApiError } from '../../utils/api-error.ts';

import * as serialStatisticsInterface from '../../interfaces/serial/serial-statistics-interface.ts';

import type { CreateSerialStatisticsHttp } from '../../validations/serial/serial-statistics-validation.ts';

export async function createSerialStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { statistics_type, output_format }: CreateSerialStatisticsHttp = req.body;

    const result = await serialStatisticsInterface.createSerialStatistics(req.body);

    if (output_format === STATISTICS_FORMAT.CSV) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tunnisteportaali-serial-${statistics_type}.csv"`);
      await result.csv.write(res);
      return res.status(HttpStatus.OK).end();
    }

    if (output_format === STATISTICS_FORMAT.XLSX) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="tunnisteportaali-serial-${statistics_type}.xlsx"`);
      await result.xlsx.write(res);
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
