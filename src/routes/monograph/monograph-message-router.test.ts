import { runIntegrationTestSuite } from '../../test-utils/generate-integration-test.ts';

const routers = ['monograph', 'messages'];

runIntegrationTestSuite(routers, 'create-from-template');
runIntegrationTestSuite(routers, 'send');
runIntegrationTestSuite(routers, 'resend');
runIntegrationTestSuite(routers, 'read');
runIntegrationTestSuite(routers, 'search');
