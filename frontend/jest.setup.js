import '@testing-library/jest-dom';

// Suppress warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
