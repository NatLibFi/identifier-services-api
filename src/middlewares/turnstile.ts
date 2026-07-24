import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import { ApiError } from '../utils/api-error.ts';
import { isAutomatedTest, isDevelopment } from '../utils/generic-utils.ts';
import { isAdmin, isPublisher } from '../utils/permission-utils.ts';
import type { TurnstileConfiguration } from '../app.ts';

export function initializeTurnstileMiddleware(turnstileConfiguration: TurnstileConfiguration) {
  async function validateTurnstile(req: Request, _res: Response, next: NextFunction) {
    // If turnstile has been disabled, automatically pass the check
    if (turnstileConfiguration.DISABLE_TURNSTILE === true) {
      return next();
    }

    // Do not utilize this middleware elsewhere than production and staging
    if (isAutomatedTest() || isDevelopment()) {
      return next();
    }

    // Registered users are allowed to continue without turnstile validation
    if (isAdmin(req.user) || isPublisher(req.user)) {
      return next();
    }

    // Support both v1 and v2 naming schemes
    const { turnstile_token, turnstileToken } = req.body;
    if (!turnstile_token && !turnstileToken) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Unprocessable entity', 'Turnstile token cannot be found.');
    }

    const token = turnstile_token || turnstileToken;

    const formData = new FormData();
    formData.append('secret', turnstileConfiguration.TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const result = await fetch(turnstileConfiguration.TURNSTILE_URL, {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    if (!outcome || typeof outcome !== 'object' || !Object.keys(outcome).includes('success')) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Turnstile verification response was unexpected and could not be processed by API server.',
      );
    }

    // @ts-expect-error outcome typing has been confirmed in previous runtime check
    if (outcome.success) {
      return next();
    }

    throw new ApiError(HttpStatus.FORBIDDEN, 'Forbidden');
  }

  return { validateTurnstile };
}
