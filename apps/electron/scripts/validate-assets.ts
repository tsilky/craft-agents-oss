/**
 * Post-build validation script.
 *
 * Checks that critical build artifacts exist in dist/.
 * Run: bun scripts/validate-assets.ts
 */

import { existsSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';

const requiredPaths = [
  join(distDir, 'main.cjs'),
  join(distDir, 'renderer', 'index.html'),
  join(distDir, 'resources'),
];

let ok = true;
for (const p of requiredPaths) {
  if (!existsSync(p)) {
    console.error(`✗ Missing: ${p}`);
    ok = false;
  }
}

if (ok) {
  console.log('✓ Build artifacts validated');
} else {
  process.exit(1);
}
