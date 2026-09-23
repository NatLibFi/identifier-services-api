import type { Request, Response, NextFunction } from 'express';

import HttpStatus from 'http-status';

import * as serialPublicationInterface from '../../interfaces/serial/serial-publication-interface.ts';

export async function searchSerialPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationInterface.searchSerialPublication(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateSerialPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationInterface.updateSerialPublication(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteSerialPublication(req: Request, res: Response, next: NextFunction) {
  try {
    await serialPublicationInterface.deleteSerialPublication(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
