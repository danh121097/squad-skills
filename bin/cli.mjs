#!/usr/bin/env node

import module from 'node:module';

if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Compile caching is an optional startup optimization.
  }
}

await import('../dist/cli.mjs');
