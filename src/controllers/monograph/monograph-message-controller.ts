import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import createMonographMessageInterface from '../../interfaces/monograph/monograph-message-interface.ts';

import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';

export default function createMonographMessageControllers(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  messagingConfiguration: MessagingConfiguration,
) {
  const monographMessageInterface = createMonographMessageInterface(
    monographPublisherConfiguration,
    messagingConfiguration,
  );

  async function createFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await monographMessageInterface.createFromTemplate(req.body, req.user);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function sendMonographMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await monographMessageInterface.sendMonographMessage(req.body, req.user);
      return res.status(HttpStatus.CREATED).json({ id: result });
    } catch (error) {
      return next(error);
    }
  }

  return {
    createFromTemplate,
    sendMonographMessage,
  };
}
