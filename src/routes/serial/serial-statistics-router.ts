import { Router } from 'express';

import * as serialStatisticsControllers from '../../controllers/serial/serial-statistics-controller.ts';

import { validateRequestBody } from '../../middlewares/validation.ts';
import { createSerialStatistics } from '../../validations/serial/serial-statistics-validation.ts';

export default function createSerialStatisticsRouter() {
  const serialStatisticsRouter = Router();

  serialStatisticsRouter.post(
    '/',
    validateRequestBody(createSerialStatistics),
    serialStatisticsControllers.createSerialStatistics,
  );

  return serialStatisticsRouter;
}
