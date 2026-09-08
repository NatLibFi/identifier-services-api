import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['serial', 'publishers'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'patch');
runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'search');
runIntegrationTestSuite(routers, 'autocomplete');
