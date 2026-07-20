import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publisher-requests'];

runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'update');
runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'search');

runIntegrationTestSuite(routers, 'approve');
