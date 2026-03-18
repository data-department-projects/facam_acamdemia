/**
 * Jest E2E configuration for the API workspace.
 *
 * Role: allows running end-to-end tests (usually `*.e2e-spec.ts`) from `apps/api`.
 * This file exists because the `test:e2e` script references it.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
