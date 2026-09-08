import { Router } from 'express';

import * as serialPublisherControllers from '../../controllers/serial/serial-publisher-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  createSerialPublisherSchema,
  searchSerialPublisherSchema,
  serialPublisherAutocompleteSchema,
  updateSerialPublisherSchema,
} from '../../validations/serial/serial-publisher-validation.ts';

const serialPublisherRouter = Router();

serialPublisherRouter.post(
  '/',
  validateRequestBody(createSerialPublisherSchema),
  serialPublisherControllers.createSerialPublisher,
);

serialPublisherRouter.post(
  '/search',
  validateRequestBody(searchSerialPublisherSchema),
  serialPublisherControllers.searchSerialPublisher,
);

serialPublisherRouter.post(
  '/autocomplete',
  validateRequestBody(serialPublisherAutocompleteSchema),
  serialPublisherControllers.serialPublisherAutocomplete,
);

serialPublisherRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  serialPublisherControllers.readSerialPublisher,
);
serialPublisherRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  serialPublisherControllers.deleteSerialPublisher,
);

serialPublisherRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateSerialPublisherSchema),
  serialPublisherControllers.updateSerialPublisher,
);

export default serialPublisherRouter;
