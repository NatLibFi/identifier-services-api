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

export async function readSerialPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationRequestInterface.readSerialPublicationRequest(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateSerialPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationRequestInterface.updateSerialPublicationRequest(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteSerialPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await serialPublicationRequestInterface.deleteSerialPublicationRequest(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function searchSerialPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationRequestInterface.searchSerialPublicationRequest(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function addSerialPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublicationRequestInterface.addSerialPublication(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}
