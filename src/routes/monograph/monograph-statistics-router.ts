import { Router } from 'express';

import createMonographStatisticsControllers from '../../controllers/monograph/monograph-statistics-controller.ts';

import { validateRequestBody } from '../../middlewares/validation.ts';
import { createMonographStatistics } from '../../validations/monograph/monograph-statistics-validation.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';

export default function createMonographStatisticsRouter(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  const monographStatisticsRouter = Router();
  const monographStatisticsControllers = createMonographStatisticsControllers(monographPublisherConfiguration);

  monographStatisticsRouter.post(
    '/',
    validateRequestBody(createMonographStatistics),
    monographStatisticsControllers.createMonographStatistics,
  );

  return monographStatisticsRouter;
}
