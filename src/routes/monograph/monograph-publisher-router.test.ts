import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'monograph-publisher'];

runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'update');
