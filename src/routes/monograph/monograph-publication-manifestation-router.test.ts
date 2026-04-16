import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publication-manifestations'];

runIntegrationTestSuite(routers, 'update');
