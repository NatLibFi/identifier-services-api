import { Router } from 'express';

import createSerialMessageControllers from '../../controllers/serial/serial-message-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  createSerialMessageFromTemplateSchema,
  resendSerialMessageSchema,
  searchSerialMessageSchema,
  sendSerialMessageSchema,
} from '../../validations/serial/serial-message-validation.ts';

import type { MessagingConfiguration } from '../../app.ts';

export default function createSerialMessageRouter(messagingConfiguration: MessagingConfiguration) {
  const serialMessageRouter = Router();

  const serialMessageControllers = createSerialMessageControllers(messagingConfiguration);

  serialMessageRouter.post(
    '/create-from-template',
    validateRequestBody(createSerialMessageFromTemplateSchema),
    serialMessageControllers.createFromTemplate,
  );

  serialMessageRouter.post(
    '/send',
    validateRequestBody(sendSerialMessageSchema),
    serialMessageControllers.sendSerialMessage,
  );

  serialMessageRouter.post(
    '/search',
    validateRequestBody(searchSerialMessageSchema),
    serialMessageControllers.searchSerialMessage,
  );

  serialMessageRouter.post(
    '/:id/resend',
    validateRequestParams(idParameterSchema),
    validateRequestBody(resendSerialMessageSchema),
    serialMessageControllers.resendSerialMessage,
  );

  serialMessageRouter.get('/:id', validateRequestParams(idParameterSchema), serialMessageControllers.readSerialMessage);

  return serialMessageRouter;
}
