import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'identifier-batches'];

runIntegrationTestSuite(routers, 'read'); // note: public read
runIntegrationTestSuite(routers, 'create');
runIntegrationTestSuite(routers, 'delete');
runIntegrationTestSuite(routers, 'download');
