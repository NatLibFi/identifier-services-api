import { Router } from 'express';

import * as monographPublicationController from '../../controllers/monograph/monograph-publication-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  mergeMonographPublicationSchema,
  searchMonographPublicationSchema,
  updateMonographPublicationSchema,
} from '../../validations/monograph/monograph-publication-validation.ts';

// Note: adminOnly needs to be applied at main router level
const monographPublicationRouter = Router();

monographPublicationRouter.post(
  '/search',
  validateRequestBody(searchMonographPublicationSchema),
  monographPublicationController.searchMonographPublication,
);

monographPublicationRouter.post(
  '/:id/merge',
  validateRequestParams(idParameterSchema),
  validateRequestBody(mergeMonographPublicationSchema),
  monographPublicationController.mergeMonographPublication,
);

monographPublicationRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema),
  monographPublicationController.readMonographPublication,
);

monographPublicationRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublicationSchema),
  monographPublicationController.updateMonographPublication,
);

export default monographPublicationRouter;
