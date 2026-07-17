import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publisher-requests'];

runIntegrationTestSuite(routers, 'create');
