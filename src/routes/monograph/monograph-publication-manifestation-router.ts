import { Router } from 'express';

import * as monographPublicationManifestationController from '../../controllers/monograph/monograph-publication-manifestation-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  addMonographPublicationManifestationSchema,
  updateMonographPublicationManifestationSchema,
} from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import { getMarcRecordSchema } from '../../validations/marc-record-validation.ts';

// Note: adminOnly needs to be applied at main router level
const monographPublicationManifestationRouter = Router();

monographPublicationManifestationRouter.post(
  '/',
  validateRequestBody(addMonographPublicationManifestationSchema),
  monographPublicationManifestationController.addMonographPublicationManifestation,
);

// Note: using POST here as QUERY does not have enough support and GET does not work with request body
monographPublicationManifestationRouter.post(
  '/:id/marc',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(getMarcRecordSchema),
  monographPublicationManifestationController.createMonographPublicationManifestationMarc,
);

monographPublicationManifestationRouter.post(
  '/:id/assign-identifier',
  validateRequestParams(idParameterSchema, true),
  monographPublicationManifestationController.assignManifestationIdentifier,
);

monographPublicationManifestationRouter.post(
  '/:id/deassign-identifier',
  validateRequestParams(idParameterSchema, true),
  monographPublicationManifestationController.deassignManifestationIdentifier,
);

monographPublicationManifestationRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublicationManifestationSchema),
  monographPublicationManifestationController.updateMonographPublicationManifestation,
);

monographPublicationManifestationRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  monographPublicationManifestationController.deleteMonographPublicationManifestation,
);

export default monographPublicationManifestationRouter;
