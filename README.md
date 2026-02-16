# Identifier Services API

**Please note this version of the API is a work in progress**

## Introduction

Identifier Services system is a custom built system for ISBN, ISMN and ISSN services provided by National Library of Finland. Identifier Services API is the component of the system that provides interaction layer between user-interfaces and database.

Identifier Services API next iteration is written using TypeScript erasable syntax so that it can be run directly with Node. **The current main safety net for confirming written TypeScript is using only Node compatible instructions is running `npm run build` within CI-pipeline - do not remove this from GitHub Actions configuration.**

Identifier Services API is based on the original [Identifier Registry](https://github.com/petkivim/id-registry) by [Petteri Kivimäki](https://github.com/petkivim/).

## Tests

Currently integration tests are prioritized over unit tests.

During start of testing a global setup function is run. This function starts a containerized MySQL instance using testcontainers package to provide temporary database layer. Only one persistent instance of db container is created, but for each test requiring the database layer a separate database is created with database name of UUIDv4 and dropped after the test has finished. This allows separate test files to run concurrently but as Vitest runs tests defined within same file sequentially, it is possible to utilize one database per file which may be re-migrated as required before each test. This testing setup where multiple databases are utilized within one testcontainer was inspired by [dev.to article written by John Teagure](https://dev.to/jcteague/using-testconatiners-with-vitest-499f).

### Integration tests

All integration tests should have a definition under `test-fixtures/routes` and contain at least `metadata.json` file with the following content:

```json
  "description": "[<user role>] <description of what is tested>",
  "url": "/<path-to-test>",
  "method": "<http-method-in-uppercase>",
  "expectedStatus": "<expected-http-status-as-number>"
```

Additionally if you wish to test using authenticated user role, define `"role": "<role>"` to metadata.json also (the one in description is used only to describe the test, not for acquiring required type of access token for the application role). You may also use `"skip": true` or `"only": true` directives here for individual tests if need be.

In addition to `metadata.json` you may define `db-init.json` and `db-expected.json` to initialize and compare db state. For HTTP payload and expectation comparison you may use `http-payload.json` and `http-expected.json`.

For database-related mocks (db-init.json and db-expected.json) it is expected to use the following format:

```jsonc
// db-init.json or db-expected.json
{
  "table_name": [
    {
      // Table entry here as it should be inserted to db
      // With the exception of defining timestamps as ISO strings as explained above
    },
  ],
}
```

## Technical guide

### Installation (development)

Clone the repo, install npm packages using `npm i`. Then setup your development env file by renaming `example.env` to `.env.dev` and adjust the settings as necessary (e.g., place correct connection settings for your development Keycloak instance and database). Start API in development mode with `npm run start:dev` which will start server in port 8080. Note that using `npm run dev` will run tests with .only -definition in watch mode.

Note that when in development mode, the application logic may differ from staging/production mode.

### Installation (staging/production)

For production use it is proposed to use provided Dockerfile for building a image that should be run in safe container environments.

## License and copyright

Copyright (c) of Identifier Registry 2016 University Of Helsinki (The National Library Of Finland), Petteri Kivimäki

Copyright (c) of Identifier Services API 2023-2026 **University Of Helsinki (The National Library Of Finland)**

This **branch** source code is licensed under the terms of **MIT**.
