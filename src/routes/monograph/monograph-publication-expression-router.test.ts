import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publication-expressions'];

runIntegrationTestSuite(routers, 'add');
runIntegrationTestSuite(routers, 'update');
