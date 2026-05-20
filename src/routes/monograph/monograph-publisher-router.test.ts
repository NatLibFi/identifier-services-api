import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publishers'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'update');

runIntegrationTestSuite(routers, 'search');
runIntegrationTestSuite(routers, 'autocomplete');
