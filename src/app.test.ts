import { expect, test, describe } from 'vitest';

import startApp from './app.ts';
import { Server } from 'node:http';

describe('app.ts default export', async () => {
  test('properly starts http-server', async () => {
    const testAppOptions = {
      applicationRoleMap: {},
      // Please note the following are not proper production values but rather the ones used by all tests!
      monographPublisherConfiguration: {
        SELF_PUBLISHER_ID: 1000,
        STATE_PUBLISHER_ID: 2000,
        HY_PUBLISHER_ID: 3000,
      },
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
