import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publication-manifestations'];

runIntegrationTestSuite(routers, 'update');
runIntegrationTestSuite(routers, 'assign-identifier');
runIntegrationTestSuite(routers, 'deassign-identifier');
