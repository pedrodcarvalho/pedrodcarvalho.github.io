/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig applies the project's Astro/Vite settings, so `@/` imports resolve in tests.
export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
