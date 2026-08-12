import { Router } from 'express';

import * as messageTemplateControllers from '../controllers/message-template-controller.ts';

import { validateRequestBody, validateRequestParams, validateRequestQuery } from '../middlewares/validation.ts';

import { getMessageTemplateSchema, updateMessageTemplateSchema } from '../validations/message-template-validation.ts';
import { idParameterSchema } from '../validations/common-validation.ts';

export default function () {
  const messageTemplateRouter = Router();

  messageTemplateRouter.get(
    '/',
    validateRequestQuery(getMessageTemplateSchema),
    messageTemplateControllers.getMessageTemplate,
  );
  messageTemplateRouter.patch(
    '/:id',
    validateRequestParams(idParameterSchema, true),
    validateRequestBody(updateMessageTemplateSchema),
    messageTemplateControllers.updateMonographPublication,
  );

  return messageTemplateRouter;
}
