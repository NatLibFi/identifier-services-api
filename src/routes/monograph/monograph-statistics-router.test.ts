import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'statistics'];

runIntegrationTestSuite(routers, 'create');
