import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationRequestInterface from '../../interfaces/monograph/monograph-publication-request-interface.ts';

export async function createMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationRequestInterface.createMonographPublicationRequest(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function readMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationRequestInterface.readMonographPublicationRequest(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationRequestInterface.updateMonographPublicationRequest(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function searchMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationRequestInterface.searchMonographPublicationRequest(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function approveMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationRequestInterface.approveMonographPublicationRequest(Number(req.params['id']), req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function rejectMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationRequestInterface.rejectMonographPublicationRequest(Number(req.params['id']), req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
