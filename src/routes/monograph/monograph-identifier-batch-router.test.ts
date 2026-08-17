import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'identifier-batches'];

runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'delete');
