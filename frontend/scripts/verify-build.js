#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const THRESHOLDS = {
  maxBundleSize: 500, // KB (total dist)
  maxJSBundle: 300, // KB (main JS bundle)
  maxCSSBundle: 100, // KB (CSS)
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2);
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function analyzeDirectory(dirPath) {
  const files = [];
  let totalSize = 0;

  if (!fs.existsSync(dirPath)) {
    return { files: [], totalSize: 0, byType: {} };
  }

  const walkDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        const size = getFileSize(fullPath);
        const relPath = path.relative(dirPath, fullPath);
        const ext = path.extname(relPath);

        files.push({ path: relPath, size, ext });
        totalSize += size;
      }
    });
  };

  walkDir(dirPath);

  // Group by type
  const byType = {};
  files.forEach((file) => {
    byType[file.ext] = (byType[file.ext] || 0) + file.size;
  });

  return { files, totalSize, byType };
}

function main() {
  log('', 'cyan');
  log('🎨 Frontend Production Build Verification', 'bright');
  log('='.repeat(50), 'cyan');
  log('', 'cyan');

  const distPath = path.join(__dirname, '..', 'dist');

  log('Analyzing frontend distribution...', 'yellow');
  const { files, totalSize, byType } = analyzeDirectory(distPath);

  if (files.length === 0) {
    log('', 'cyan');
    log('❌ No distribution files found', 'red');
    log(`   Expected: ${distPath}`, 'red');
    log('   Run: npm run build', 'yellow');
    log('', 'cyan');
    process.exit(1);
  }

  // Sort by size descending
  files.sort((a, b) => b.size - a.size);

  const totalSizeKB = formatSize(totalSize);

  log('', 'cyan');
  log(`📊 Build Statistics:`, 'bright');
  log(`   Total Size:        ${totalSizeKB} KB`, totalSize > THRESHOLDS.maxBundleSize * 1024 ? 'red' : 'green');
  log(`   Files:             ${files.length}`, 'cyan');

  // Show breakdown by type
  if (Object.keys(byType).length > 0) {
    log('', 'cyan');
    log(`📦 Breakdown by Type:`, 'bright');
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ext, size]) => {
        const sizeKB = formatSize(size);
        const extName = ext || 'other';
        log(`   ${extName.padEnd(10)} ${sizeKB.padStart(8)} KB`, 'cyan');
      });
  }

  log('', 'cyan');

  // Check thresholds
  let hasWarnings = false;
  let hasErrors = false;

  if (totalSize > THRESHOLDS.maxBundleSize * 1024) {
    log(`⚠️  WARNING: Total bundle size (${totalSizeKB} KB) exceeds threshold (${THRESHOLDS.maxBundleSize} KB)`, 'yellow');
    hasWarnings = true;
  }

  // Check JS bundles
  const jsFiles = files.filter((f) => f.ext === '.js');
  jsFiles.forEach((file) => {
    const sizeKB = formatSize(file.size);
    if (file.size > THRESHOLDS.maxJSBundle * 1024) {
      log(`⚠️  WARNING: JS file ${file.path} (${sizeKB} KB) exceeds threshold (${THRESHOLDS.maxJSBundle} KB)`, 'yellow');
      hasWarnings = true;
    }
  });

  // Check CSS bundles
  const cssFiles = files.filter((f) => f.ext === '.css');
  cssFiles.forEach((file) => {
    const sizeKB = formatSize(file.size);
    if (file.size > THRESHOLDS.maxCSSBundle * 1024) {
      log(`⚠️  WARNING: CSS file ${file.path} (${sizeKB} KB) exceeds threshold (${THRESHOLDS.maxCSSBundle} KB)`, 'yellow');
      hasWarnings = true;
    }
  });

  // Show top files
  if (files.length > 0) {
    log('', 'cyan');
    log('📈 Top 10 Largest Files:', 'bright');
    log('', 'cyan');

    files.slice(0, 10).forEach((file, idx) => {
      const sizeKB = formatSize(file.size);
      const isLarge = file.size > THRESHOLDS.maxJSBundle * 1024;
      log(`   ${idx + 1}. ${file.path}`, 'cyan');
      log(`      ${sizeKB} KB`, isLarge ? 'red' : 'green');
    });
    log('', 'cyan');
  }

  // Summary
  log('='.repeat(50), 'cyan');
  if (hasErrors) {
    log('❌ BUILD VERIFICATION FAILED', 'red');
    log('', 'cyan');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  BUILD VERIFICATION PASSED WITH WARNINGS', 'yellow');
    log('', 'cyan');
    log('To optimize:', 'yellow');
    log('  • Enable code splitting for large chunks', 'yellow');
    log('  • Tree-shake unused dependencies', 'yellow');
    log('  • Use dynamic imports for route components', 'yellow');
    log('', 'cyan');
    process.exit(0);
  } else {
    log('✅ BUILD VERIFICATION PASSED', 'green');
    log('', 'cyan');
    process.exit(0);
  }
}

main();
