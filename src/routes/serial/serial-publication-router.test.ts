import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['serial', 'publications'];

runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'search');
runIntegrationTestSuite(routers, 'update');
