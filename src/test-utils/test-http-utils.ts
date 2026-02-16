import { expect } from 'vitest';

import { APPLICATION_ROLES } from '../constants.ts';
import type { TestDefinition } from './generate-integration-test.ts';

// Use loopback to avoid needing to resolve hostname
const BASE_URL = 'http://127.0.0.1';

export async function getAccessToken(role: string | undefined, serverPort: number) {
  if (!role) {
    return undefined;
  }

  const validRoles = Object.values(APPLICATION_ROLES);
  if (!validRoles.includes(role)) {
    throw new Error(`role ${role} is not listed in valid application roles`);
  }

  // NB: these are loaded from test-fixtures/integration-test-users.json
  // using role as username and password is just to simplify test metadata configuration
  const username = role;
  const password = role;

  const basicAuth = Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');

  const response = await fetch(`${BASE_URL}:${serverPort}/test-auth`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Test authentication failed for some reason');
  }

  const responseBody = await response.json();
  if (!responseBody || typeof responseBody !== 'object') {
    throw new Error('Test authentication response body was not parseable JSON object');
  }

  if (!Object.keys(responseBody).includes('accessToken')) {
    throw new Error('Test authentication response body was missing access token');
  }

  // @ts-expect-error type definition for this specific response is missing
  return responseBody.accessToken;
}

export async function sendTestHttpRequest(
  testDefinition: TestDefinition,
  accessToken: string | undefined,
  serverPort: number,
) {
  const { metadata, httpPayload } = testDefinition;
  const { url, method } = metadata;

  const authorizationHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  const contentTypeHeader = { 'Content-Type': 'application/json' };

  const headers = authorizationHeader ? { ...authorizationHeader, ...contentTypeHeader } : { ...contentTypeHeader };

  if (httpPayload) {
    const response = await fetch(`${BASE_URL}:${serverPort}${url}`, {
      method,
      headers,
      body: JSON.stringify(httpPayload),
    });

    return response;
  }

  const response = await fetch(`${BASE_URL}:${serverPort}${url}`, {
    method,
    headers,
  });

  return response;
}

export async function validateHttpResponse(testDefinition: TestDefinition, response: Response) {
  const { metadata, httpExpected } = testDefinition;
  const { expectedStatus } = metadata;

  // Status needs to always be defined and match expectations
  expect(response.status).to.toStrictEqual(expectedStatus);

  // Response headers are not tested currently

  // If expected response body is defined, it is tested
  if (httpExpected) {
    const responseBody = await response.json();
    expect(responseBody).toStrictEqual(httpExpected);
    return;
  }

  // Otherwise it will be tested that there is nothing within response body (as body was not expected)
  const responseBody = await response.text();
  const responseBodyIsEmpty = Object.keys(responseBody).length === 0;

  expect(responseBodyIsEmpty).toStrictEqual(true);
  return;
}
