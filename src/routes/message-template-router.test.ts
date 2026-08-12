import { runIntegrationTestSuite } from '../test-utils/generate-integration-test.ts';

const routers = ['message-templates'];

runIntegrationTestSuite(routers, 'get');
runIntegrationTestSuite(routers, 'update');
