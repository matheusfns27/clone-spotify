import { defineConfig, devices } from '@playwright/test';

// Os testes e2e rodam contra o build de produção servido pelo `vite preview`.
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4175/clone-spotify/',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4175 --strictPort',
    url: 'http://localhost:4175/clone-spotify/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
