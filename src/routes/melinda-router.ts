import { Router } from 'express';

import createMelindaControllers from '../controllers/melinda-controller.ts';

import { validateRequestBody } from '../middlewares/validation.ts';
import { sendToMelindaSchema } from '../validations/melinda-validation.ts';

import type { MelindaConfiguration } from '../app.ts';

export default function (melindaConfiguration: MelindaConfiguration) {
  const melindaRouter = Router();

  const melindaControllers = createMelindaControllers(melindaConfiguration);

  melindaRouter.post('/', validateRequestBody(sendToMelindaSchema), melindaControllers.sendToMelinda);

  return melindaRouter;
}
