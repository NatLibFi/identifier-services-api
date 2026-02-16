import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'isbn-ranges'];

runIntegrationTestSuite(routers, 'read-all');
