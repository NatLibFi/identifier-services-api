import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'isbn-ranges'];

runIntegrationTestSuite(routers, 'read-all');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'patch');
runIntegrationTestSuite(routers, 'delete');
