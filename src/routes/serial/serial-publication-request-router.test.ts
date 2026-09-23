import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['serial', 'publication-requests'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'update');
runIntegrationTestSuite(routers, 'delete');

runIntegrationTestSuite(routers, 'search');
runIntegrationTestSuite(routers, 'add-publication');
