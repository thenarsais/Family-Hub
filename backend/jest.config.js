module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  // api.health.test.ts hits a live server over the network (fetch to localhost:3000) —
  // it's a smoke test, not a unit test, and duplicates tests/smoke.test.ts (run via
  // `npm run test:smoke` against a running server). It always fails under plain `jest`
  // because nothing starts a server first. Excluded here rather than deleted since it's
  // still useful when actually run against a live instance.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/__tests__/api.health.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/server.ts',
    // One-shot CLI scripts that execute immediately on import (fs/pg/dotenv
    // side effects at module scope, no exports) -- not application logic
    // that's reused or unit-testable, same category as runMigrations.ts/
    // seed.ts below.
    '!src/runMigrations.ts',
    '!src/migrations.ts',
    '!src/runMigrationsV2.ts',
    '!src/seed.ts',
    // Pure type declarations, no runtime behavior to cover.
    '!src/types/database.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
};
