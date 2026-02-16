import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';
import { ZodError, type ZodType } from 'zod';

import { ApiError } from '../utils/api-error.ts';
import { ApiValidationError } from '../utils/api-validation-error.ts';

export function validateRequestBody(schema: ZodType) {
  const allowedRequestTypesWithBody = ['patch', 'put', 'post'];

  return (req: Request, _res: Response, next: NextFunction) => {
    const requestMethodIsValid = allowedRequestTypesWithBody.includes(req.method.toLowerCase());
    if (!requestMethodIsValid) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Invalid method',
        `API does not support having request body with method of ${req.method}`,
      );
    }

    try {
      schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(({ path, message }) => `[${path.join('.')}] ${message}`);
        throw new ApiValidationError(errorMessages);
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Unknown validation error',
        'Unknown validation error occurred regarding request body',
      );
    }
  };
}

export function validateRequestQuery(schema: ZodType) {
  const allowedRequestTypesWithQuery = ['get'];

  return (req: Request, _res: Response, next: NextFunction) => {
    const requestMethodIsValid = allowedRequestTypesWithQuery.includes(req.method.toLowerCase());
    if (!requestMethodIsValid) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        `API does not support having request query with method of ${req.method}`,
      );
    }

    try {
      schema.parse(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(({ path, message }) => `[${path.join('.')}] ${message}`);
        throw new ApiValidationError(errorMessages);
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Unknown validation error',
        'Unknown validation error occurred regarding request query',
      );
    }
  };
}

export function validateRequestParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(({ path, message }) => `[${path.join('.')}] ${message}`);
        throw new ApiValidationError(errorMessages);
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Unknown validation error',
        'Unknown validation error occurred regarding request parameters',
      );
    }
  };
}
