import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import createSerialMessageInterface from '../../interfaces/serial/serial-message-interface.ts';

import type { MessagingConfiguration } from '../../app.ts';

export default function createSerialMessageControllers(messagingConfiguration: MessagingConfiguration) {
  const serialMessageInterface = createSerialMessageInterface(messagingConfiguration);

  async function createFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serialMessageInterface.createFromTemplate(req.body, req.user);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function sendSerialMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serialMessageInterface.sendSerialMessage(req.body, req.user);
      return res.status(HttpStatus.CREATED).json({ id: result });
    } catch (error) {
      return next(error);
    }
  }

  async function resendSerialMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serialMessageInterface.resendSerialMessage(Number(req.params['id']), req.body, req.user);
      return res.status(HttpStatus.CREATED).json({ id: result });
    } catch (error) {
      return next(error);
    }
  }

  async function readSerialMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serialMessageInterface.readSerialMessage(Number(req.params['id']));
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function searchSerialMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serialMessageInterface.searchSerialMessages(req.body);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  return {
    createFromTemplate,
    sendSerialMessage,
    resendSerialMessage,
    readSerialMessage,
    searchSerialMessage,
  };
}
