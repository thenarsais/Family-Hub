// Jest setup file
// Runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/family_hub_test';
process.env.API_PORT = '3001';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.SMARTTHINGS_TOKEN = 'mock-token';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);
