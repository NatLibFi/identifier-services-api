import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['serial', 'statistics'];

runIntegrationTestSuite(routers, 'create');
