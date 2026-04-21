import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'publication-requests'];

// runIntegrationTestSuite(routers, 'create');
// runIntegrationTestSuite(routers, 'read');
// runIntegrationTestSuite(routers, 'update');
// runIntegrationTestSuite(routers, 'search');

// runIntegrationTestSuite(routers, 'approve');
runIntegrationTestSuite(routers, 'reject');
