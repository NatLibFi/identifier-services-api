import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'ismn-publisher-ranges'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'delete');

runIntegrationTestSuite(routers, 'read-public');
runIntegrationTestSuite(routers, 'get-identifiers');
