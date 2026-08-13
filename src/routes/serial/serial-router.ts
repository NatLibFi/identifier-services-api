import { Router } from 'express';

// import { allowAdminOnly } from '../../middlewares/auth.ts';

// import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';
// import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createSerialRouter() {
  // messagingConfiguration: MessagingConfiguration,
  // turnstileMiddleware: MiddlewareFunction,
  const monographRouter = Router();
  return monographRouter;
}
