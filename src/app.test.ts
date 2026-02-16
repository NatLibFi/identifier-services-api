import { expect, test, describe } from 'vitest';

import startApp from './app.ts';
import { Server } from 'node:http';

describe('app.ts default export', async () => {
  test('properly starts http-server', async () => {
    const testAppOptions = {
      applicationRoleMap: {},
      environment: 'test',
      httpPort: 0,
      keycloakOptions: {
        localUsers: 'file://test-fixtures/integration-test-users.json',
      },
      logLevel: 'silent',
    };

    const result = await startApp(testAppOptions);
    expect(result instanceof Server).toBe(true);
    await result.close();
  });
});
