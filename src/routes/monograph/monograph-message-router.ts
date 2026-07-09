import { Router } from 'express';

import createMonographMessageControllers from '../../controllers/monograph/monograph-message-controller.ts';
import { validateRequestBody } from '../../middlewares/validation.ts';
import {
  createMonographMessageFromTemplateSchema,
  sendMonographMessageSchema,
} from '../../validations/monograph/monograph-message-validation.ts';

import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';

export default function createMonographMessageRouter(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  messagingConfiguration: MessagingConfiguration,
) {
  const monographMessageRouter = Router();

  const monographMessageControllers = createMonographMessageControllers(
    monographPublisherConfiguration,
    messagingConfiguration,
  );

  monographMessageRouter.post(
    '/create-from-template',
    validateRequestBody(createMonographMessageFromTemplateSchema),
    monographMessageControllers.createFromTemplate,
  );

  monographMessageRouter.post(
    '/send',
    validateRequestBody(sendMonographMessageSchema),
    monographMessageControllers.sendMonographMessage,
  );

  return monographMessageRouter;
}
