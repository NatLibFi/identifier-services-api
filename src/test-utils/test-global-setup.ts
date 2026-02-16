import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';

let container: StartedMySqlContainer;

// @ts-expect-error provide typing missing
export async function setup({ provide }) {
  console.log(
    'Starting global setup which involves starting a db container. This might take a while, please be patient.',
  );
  container = await new MySqlContainer('docker.io/mysql:8.4').withExposedPorts(3306).start();

  provide('dbConfig', {
    host: container.getHost(),
    port: container.getFirstMappedPort(),
    user: 'root',
    password: container.getRootPassword(),
  });

  console.log('Global setup completed. Database container is now ready for tests.');
}

export async function teardown() {
  console.log('Starting global teardown which will stop database container.');
  await container.stop();
  console.log('Global teardown was completed successfully.');
}
