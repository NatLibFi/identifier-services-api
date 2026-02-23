import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'isbn-ranges'];

runIntegrationTestSuite(routers, 'read-all');
runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'patch');
