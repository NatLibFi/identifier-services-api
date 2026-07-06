import { Router } from 'express';

import createMonographMessageControllers from '../../controllers/monograph/monograph-message-controller.ts';
import { validateRequestBody } from '../../middlewares/validation.ts';
import { createMonographMessageFromTemplateSchema } from '../../validations/monograph/monograph-message-validation.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';

export default function createMonographMessageRouter(monographPublisherConfiguration: MonographPublisherConfiguration) {
  const monographMessageRouter = Router();

  const monographMessageControllers = createMonographMessageControllers(monographPublisherConfiguration);

  monographMessageRouter.post(
    '/create-from-template',
    validateRequestBody(createMonographMessageFromTemplateSchema),
    monographMessageControllers.createFromTemplate,
  );

  return monographMessageRouter;
}
