import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import Sinon from 'sinon';
import { describe, inject, onTestFailed, test } from 'vitest';

import startApp from '../app.ts';

import { dropTestDatabase, initializeTestDb, validateDbState } from './test-database-utils.ts';
import { getAccessToken, sendTestHttpRequest, validateHttpResponse } from './test-http-utils.ts';

import { TEST_CREATION_DATE, TEST_MODIFICATION_DATE } from './test-constants.ts';

import type { UnknownObject } from '../generic-types.ts';

interface TestMetadata {
  description: string;
  url: string;
  method: string;
  expectedStatus: number;
  only?: boolean;
  role?: string;
  skip?: boolean;
}

export interface TestDefinition {
  metadata: TestMetadata;
  dbExpected: Record<string, UnknownObject[]>;
  dbInit: Record<string, UnknownObject[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpExpected: UnknownObject[] | Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpPayload: UnknownObject[] | Record<string, any>;
}

export function runIntegrationTestSuite(routers: string[], controllerFunction: string) {
  const testFixturesRoot = path.resolve(__dirname, '../../test-fixtures/routes');
  const controllerTestRoot = path.join(testFixturesRoot, ...routers, controllerFunction);

  if (!existsSync(controllerTestRoot)) {
    throw new Error(`Path ${controllerTestRoot} does not exist`);
  }

  const acceptedTestDefinitionRegexp = /^\d{2}$/;
  const testDefinitions = readdirSync(controllerTestRoot, { withFileTypes: true });

  const containsInvalidTestDefinitions = testDefinitions.some(
    (testDefinition) => !testDefinition.isDirectory() || !acceptedTestDefinitionRegexp.test(testDefinition.name),
  );

  if (containsInvalidTestDefinitions) {
    throw new Error(
      `Integration test directory ${controllerTestRoot} contains invalid test definitions: test root folder should only contain folders 01-99`,
    );
  }

  const testPaths = testDefinitions.map((testDefinition) => path.join(controllerTestRoot, testDefinition.name));

  describe(`${routers.join('/')}:${controllerFunction}`, async () => {
    for (const testPath of testPaths) {
      await runTest(testPath);
    }
  });
}

async function runTest(testRootPath: string) {
  // Read and validate test definition
  const testDefinition: TestDefinition = readTestContents(testRootPath);
  validateTestDefinition(testDefinition);

  // Destructure for readability
  const { metadata, dbExpected, dbInit } = testDefinition;

  // Generate test defitinion. Note skip and only directives are defined here based on given metadata.
  test.skipIf(Boolean(metadata.skip))(`${metadata.description}`, { only: Boolean(metadata.only) }, async () => {
    // Step 0 - initialize mock date so that all db entries are created in pre-defined datetime
    const CLOCK = Sinon.useFakeTimers({
      now: TEST_CREATION_DATE.toJSDate(),
      shouldAdvanceTime: false,
      toFake: ['Date'],
    });

    // Step 1 - initialize db if initialized date was given
    // @ts-expect-error vitest injection
    const dbConfig = inject('dbConfig');
    let database: string | undefined;

    if (dbInit) {
      // It seems mysql may throw error on too many connections
      // This will fail test in a way that CLOCK.restore() will not be called
      // And result into an Sinon error which will hide the underlying reason
      // This try-catch block is here only for handling the case so that proper
      // error message is thrown and may be debugged
      try {
        database = await initializeTestDb(dbConfig, dbInit);
      } catch (error) {
        CLOCK.restore();
        throw error;
      }
    }

    // Make sure that db is dropped in case test fails
    onTestFailed(async () => {
      if (database) {
        await dropTestDatabase(dbConfig, database);
      }

      if (CLOCK) {
        CLOCK.restore();
      }
    });

    // DB initialization is completed. Step forward in time to expected modified date where HTTP calls are processed.
    CLOCK.setSystemTime(TEST_MODIFICATION_DATE.toJSDate());

    // Step 2 - start application server in free port
    // https://expressjs.com/de/api.html#app.listen -> "If port is omitted or is 0, the operating system will assign an arbitrary unused port"
    const httpServer = await startApp({
      applicationRoleMap: { admin: ['admin'], publisher: ['publisher'] },
      enableProxy: false,
      environment: 'test',
      httpPort: 0,
      keycloakOptions: {
        localUsers: 'file://test-fixtures/integration-test-users.json',
      },
      logLevel: 'silent',
    });

    // @ts-expect-error port property exists per docs
    const serverPort = httpServer.address()?.port;

    // Step 3 - send http request with appropriate access token if role is defined
    const accessToken = await getAccessToken(metadata.role, serverPort);
    const response = await sendTestHttpRequest(testDefinition, accessToken, serverPort);

    await httpServer.close();

    // Step 4 - validate response to http request
    await validateHttpResponse(testDefinition, response);

    // Step 5 - validate application database state after processing the http call if DB expectations were defined
    if (dbExpected) {
      await validateDbState(dbExpected);
    }

    // Drop db if it was initialized as this would otherwise be done only in case test fails
    if (database) {
      await dropTestDatabase(dbConfig, database); // Note: also drops Kysely singleton
    }

    // Reset clock
    CLOCK.restore();
  });
}

function readTestContents(testRootPath: string): TestDefinition {
  validateTestFolder(testRootPath);

  return {
    metadata: readJson(testRootPath, 'metadata.json'),
    dbInit: readJson(testRootPath, 'db-init.json'),
    dbExpected: readJson(testRootPath, 'db-expected.json'),
    httpExpected: readJson(testRootPath, 'http-expected.json'),
    httpPayload: readJson(testRootPath, 'http-payload.json'),
  };
}

function validateTestFolder(testPath: string) {
  const requiredContent = ['metadata.json'];
  const optionalContent = ['db-expected.json', 'db-init.json', 'http-expected.json', 'http-payload.json'];
  const testContents = readdirSync(testPath, { withFileTypes: true });

  const invalidContent = testContents.find(
    (testContent) => testContent.isDirectory() || ![...requiredContent, ...optionalContent].includes(testContent.name),
  );

  if (invalidContent) {
    throw new Error(
      `File ${testPath}/${invalidContent.name} is not valid test file. Please define tests using only valid files (see README.md).`,
    );
  }

  const requiredContentMissing = requiredContent.find(
    (requiredFile) => !testContents.find((content) => content.name === requiredFile),
  );

  if (requiredContentMissing) {
    throw new Error(
      `File ${testPath}/${requiredContent} is missing. Defining this file for integration test is mandatory.`,
    );
  }
}

function validateTestDefinition(testDefinition: TestDefinition) {
  const { metadata, dbExpected, dbInit, httpExpected, httpPayload } = testDefinition;

  if (!metadata) {
    throw new Error('Metadata is missing');
  }

  const mandatoryMetadata = ['description', 'url', 'method', 'expectedStatus'];

  const missingMetadataAttr = mandatoryMetadata.find((metadataAttr) => !Object.keys(metadata).includes(metadataAttr));
  if (missingMetadataAttr) {
    throw new Error(`metadata.json is missing mandatory attribute ${missingMetadataAttr}`);
  }

  const validDbExpected = !dbExpected || isObject(dbExpected);
  if (!validDbExpected) {
    throw new Error(
      'db-expected.json is not valid: use format of object containing table name as key and containing array of db entries as value',
    );
  }

  const validDbInit = !dbInit || isObject(dbInit);
  if (!validDbInit) {
    throw new Error(
      'db-init.json is not valid: use format of object containing table name as key and containing array of db entries as value',
    );
  }

  const validHttpPayload = !httpPayload || Array.isArray(httpPayload) || isObject(httpPayload);
  if (!validHttpPayload) {
    throw new Error('http-payload.json is not valid');
  }

  const validHttpExpected = !httpExpected || Array.isArray(httpExpected) || isObject(httpExpected);
  if (!validHttpExpected) {
    throw new Error('http-expected.json is not valid');
  }
}

function isObject(value: unknown) {
  if (value === null) {
    return false;
  }

  return typeof value === 'object' && !Array.isArray(value);
}

function readJson(testRootPath: string, filename: string) {
  try {
    const fileContent = readFileSync(`${testRootPath}/${filename}`, 'utf-8');
    return JSON.parse(fileContent);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return undefined;
  }
}
