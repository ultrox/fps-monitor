import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'src/content.ts',
    output: {
      file: 'dist/content.js',
      format: 'iife',
    },
  },
  {
    input: 'src/popup.ts',
    output: {
      file: 'dist/popup.js',
      format: 'iife',
    },
  },
]);
