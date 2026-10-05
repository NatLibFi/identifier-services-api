import type { Request, Response, NextFunction } from 'express';

import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { MARC_RECORD_FORMAT } from '../../constants.ts';
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

export async function assignSerialPublicationIssnIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationInterface.assignSerialPublicationIssnIdentifier(
      Number(req.params['id']),
      req.user,
    );

    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function revokeSerialPublicationIssnIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationInterface.revokeSerialPublicationIssnIdentifier(
      Number(req.params['id']),
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createSerialPublicationMarc(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationInterface.createSerialPublicationMarc(Number(req.params['id']), req.body);

    const { record_format } = req.body;

    if (record_format === MARC_RECORD_FORMAT.TEXT) {
      res.setHeader('content-type', 'text/plain');
      return res.status(HttpStatus.OK).attachment(`serial-publication-${req.params['id']}.txt`).send(result);
    }

    if (record_format === MARC_RECORD_FORMAT.ISO2709) {
      // Using default content-type for binary types
      res.setHeader('content-type', 'application/octet-stream');
      return res.status(HttpStatus.OK).attachment(`serial-publication-${req.params['id']}.mrc`).send(result);
    }

    // Using MARC_RECORD_JS is disallowed for http endpoint but allowed in validation to make typing consistent
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Cannot process format ${record_format}`,
    );
  } catch (error) {
    return next(error);
  }
}
