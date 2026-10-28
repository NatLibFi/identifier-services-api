import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import { MARC_RECORD_FORMAT } from '../../constants.ts';
import { ApiError } from '../../utils/api-error.ts';
import * as monographPublicationManifestationInterface from '../../interfaces/monograph/monograph-publication-manifestation-interface.ts';

export async function addMonographPublicationManifestation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationManifestationInterface.addMonographPublicationManifestation(
      req.body,
      req.user,
    );

    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublicationManifestation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationManifestationInterface.updateMonographPublicationManifestation(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMonographPublicationManifestation(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationManifestationInterface.deleteMonographPublicationManifestation(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function assignManifestationIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationManifestationInterface.assignManifestationIdentifier(
      Number(req.params['id']),
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deassignManifestationIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationManifestationInterface.deassignManifestationIdentifier(
      Number(req.params['id']),
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createMonographPublicationManifestationMarc(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationManifestationInterface.createMonographPublicationManifestationMarc(
      Number(req.params['id']),
      req.body,
    );

    const { record_format } = req.body;

    if (record_format === MARC_RECORD_FORMAT.TEXT) {
      res.setHeader('content-type', 'text/plain');
      return res.status(HttpStatus.OK).attachment(`monograph-manifestation-${req.params['id']}.txt`).send(result);
    }

    if (record_format === MARC_RECORD_FORMAT.ISO2709) {
      // Using default content-type for binary types
      res.setHeader('content-type', 'application/octet-stream');
      return res.status(HttpStatus.OK).attachment(`monograph-expression-${req.params['id']}.mrc`).send(result);
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
