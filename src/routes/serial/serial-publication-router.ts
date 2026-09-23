import { Router } from 'express';

import * as serialPublicationControllers from '../../controllers/serial/serial-publication-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import {
  searchSerialPublicationSchema,
  updateSerialPublicationSchema,
} from '../../validations/serial/serial-publication-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

export default function createSerialPublicationRouter() {
  const serialPublicationRouter = Router();

  serialPublicationRouter.post(
    '/search',
    validateRequestBody(searchSerialPublicationSchema),
    serialPublicationControllers.searchSerialPublication,
  );

  serialPublicationRouter.patch(
    '/:id',
    validateRequestParams(idParameterSchema, true),
    validateRequestBody(updateSerialPublicationSchema),
    serialPublicationControllers.updateSerialPublication,
  );

  serialPublicationRouter.delete(
    '/:id',
    validateRequestParams(idParameterSchema, true),
    serialPublicationControllers.deleteSerialPublication,
  );

  return serialPublicationRouter;
}
