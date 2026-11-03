import { Router } from 'express';

import { allowAdminOnly } from '../../middlewares/auth.ts';
import issnRangeRouter from './issn-range-router.ts';
import createSerialMessageRouter from './serial-message-router.ts';
import createSerialPublicationRequestRouter from './serial-publication-request-router.ts';
import createSerialPublicationRouter from './serial-publication-router.ts';
import serialPublisherRouter from './serial-publisher-router.ts';
import createSerialStatisticsRouter from './serial-statistics-router.ts';

import type { MessagingConfiguration } from '../../app.ts';
import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createSerialRouter(
  messagingConfiguration: MessagingConfiguration,
  turnstileMiddleware: MiddlewareFunction,
) {
  const serialRouter = Router();

  serialRouter.use('/issn-ranges', allowAdminOnly, issnRangeRouter);
  serialRouter.use('/publishers', allowAdminOnly, serialPublisherRouter);

  serialRouter.use('/publication-requests', createSerialPublicationRequestRouter(turnstileMiddleware));
  serialRouter.use('/publications', allowAdminOnly, createSerialPublicationRouter());

  serialRouter.use('/messages', allowAdminOnly, createSerialMessageRouter(messagingConfiguration));

  serialRouter.use('/statistics', allowAdminOnly, createSerialStatisticsRouter());

  return serialRouter;
}
