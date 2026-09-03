import { Router } from 'express';

import issnRangeRouter from './issn-range-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

// import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';
// import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createSerialRouter() {
  // messagingConfiguration: MessagingConfiguration,
  // turnstileMiddleware: MiddlewareFunction,
  const serialRouter = Router();

  serialRouter.use('/issn-ranges', allowAdminOnly, issnRangeRouter);

  return serialRouter;
}
