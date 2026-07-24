import { runIntegrationTestSuite } from '../test-utils/generate-integration-test.ts';

const routers = ['melinda'];

runIntegrationTestSuite(routers, 'send');
