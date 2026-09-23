import { Router } from 'express';

import issnRangeRouter from './issn-range-router.ts';

import serialPublisherRouter from './serial-publisher-router.ts';

import createSerialPublicationRequestRouter from './serial-publication-request-router.ts';
import createSerialPublicationRouter from './serial-publication-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

import type { MiddlewareFunction } from '../../generic-types.ts';
import type { MessagingConfiguration } from '../../app.ts';

export default function createSerialRouter(
  _messagingConfiguration: MessagingConfiguration,
  turnstileMiddleware: MiddlewareFunction,
) {
  const serialRouter = Router();

  serialRouter.use('/issn-ranges', allowAdminOnly, issnRangeRouter);
  serialRouter.use('/publishers', allowAdminOnly, serialPublisherRouter);

  serialRouter.use('/publication-requests', createSerialPublicationRequestRouter(turnstileMiddleware));
  serialRouter.use('/publications', allowAdminOnly, createSerialPublicationRouter());

  return serialRouter;
}
