import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');

// Ensure dist exists
mkdirSync('dist', { recursive: true });

// Build config
const config = {
  bundle: true,
  minify: !watch,
  sourcemap: watch,
  target: 'chrome100',
  format: 'iife',
};

async function build() {
  // Build content script
  await esbuild.build({
    ...config,
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
  });

  // Build popup script
  await esbuild.build({
    ...config,
    entryPoints: ['src/popup.ts'],
    outfile: 'dist/popup.js',
  });

  // Build background service worker
  await esbuild.build({
    ...config,
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
  });

  // Copy static assets
  cpSync('manifest.json', 'dist/manifest.json');
  cpSync('popup.html', 'dist/popup.html');
  cpSync('icons', 'dist/icons', { recursive: true });

  console.log('✓ Build complete');
}

if (watch) {
  const ctx1 = await esbuild.context({
    ...config,
    entryPoints: ['src/content.ts'],
    outfile: 'dist/content.js',
  });
  const ctx2 = await esbuild.context({
    ...config,
    entryPoints: ['src/popup.ts'],
    outfile: 'dist/popup.js',
  });
  
  await ctx1.watch();
  await ctx2.watch();
  console.log('Watching for changes...');
} else {
  await build();
}
