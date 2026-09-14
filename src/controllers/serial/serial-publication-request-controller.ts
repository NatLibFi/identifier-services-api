import type { Request, Response, NextFunction } from 'express';

import HttpStatus from 'http-status';

import * as serialPublicationRequestInterface from '../../interfaces/serial/serial-publication-request-interface.ts';

export async function createSerialPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationRequestInterface.createSerialPublicationRequest(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}
