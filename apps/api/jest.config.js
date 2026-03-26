/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    // rootDir is 'src', so <rootDir> = apps/api/src — go 3 levels up to reach monorepo root
    '^@simsim/types$': '<rootDir>/../../../packages/types/src/index.ts',
    '^@sentry/nestjs$': '<rootDir>/../__mocks__/@sentry/nestjs.ts',
  },
};
