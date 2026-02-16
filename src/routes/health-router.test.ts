import { runIntegrationTestSuite } from '../test-utils/generate-integration-test.ts';

const routers = ['health'];

runIntegrationTestSuite(routers, 'read');
