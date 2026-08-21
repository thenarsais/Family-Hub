import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Suppress warnings in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};
