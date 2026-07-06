import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import createMonographMessageInterface from '../../interfaces/monograph/monograph-message-interface.ts';

import type { MonographPublisherConfiguration } from '../../app.ts';

export default function createMonographMessageControllers(
  monographPublisherConfiguration: MonographPublisherConfiguration,
) {
  const monographMessageInterface = createMonographMessageInterface(monographPublisherConfiguration);

  async function createFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await monographMessageInterface.createFromTemplate(req.body, req.user);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  return {
    createFromTemplate,
  };
}
