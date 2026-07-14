import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'ismn-ranges'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'read-all');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'patch');
runIntegrationTestSuite(routers, 'delete');
