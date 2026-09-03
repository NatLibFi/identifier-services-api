import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['serial', 'issn-ranges'];

runIntegrationTestSuite(routers, 'read-all');
runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'patch');
runIntegrationTestSuite(routers, 'delete');
