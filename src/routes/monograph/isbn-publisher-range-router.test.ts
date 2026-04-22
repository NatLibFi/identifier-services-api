import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'isbn-publisher-ranges'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'delete');

runIntegrationTestSuite(routers, 'get-identifiers');
