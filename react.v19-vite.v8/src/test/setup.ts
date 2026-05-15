// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Optional: Automatically clean up after each test (useful for React testing)
afterEach(() => {
  cleanup();
});
