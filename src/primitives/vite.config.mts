/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/src/primitives',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [ nxViteTsPaths() ],
  // },
  test: {
    name: 'primitives',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['./**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/src/primitives',
      provider: 'v8' as const,
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.lib.json',
      include: ['./**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  },
}));
