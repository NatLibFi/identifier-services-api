import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publications'];

runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'update');
