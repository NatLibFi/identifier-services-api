import HttpStatus from 'http-status';

import createMelindaInterface from '../interfaces/melinda-interface.ts';

import type { Request, Response, NextFunction } from 'express';
import type { MelindaConfiguration } from '../app.ts';

export default function createMelindaControllers(melindaConfiguration: MelindaConfiguration) {
  const monographMessageInterface = createMelindaInterface(melindaConfiguration);

  async function sendToMelinda(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await monographMessageInterface.sendToMelinda(req.body);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  return {
    sendToMelinda,
  };
}
