#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const THRESHOLDS = {
  maxBundleSize: 500, // KB (excluding tests)
  maxIndividualFile: 250, // KB
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
  const testFiles = [];
  let totalSize = 0;
  let testSize = 0;

  if (!fs.existsSync(dirPath)) {
    return { files: [], testFiles: [], totalSize: 0, testSize: 0 };
  }

  const walkDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        const size = getFileSize(fullPath);
        const relPath = path.relative(dirPath, fullPath);
        const isTest = relPath.includes('__tests__') || relPath.includes('.test.');

        if (isTest) {
          testFiles.push({ path: relPath, size });
          testSize += size;
        } else {
          files.push({ path: relPath, size });
          totalSize += size;
        }
      }
    });
  };

  walkDir(dirPath);
  return { files, testFiles, totalSize, testSize };
}

function main() {
  log('', 'cyan');
  log('📦 Production Build Verification', 'bright');
  log('='.repeat(50), 'cyan');
  log('', 'cyan');

  const backendDistPath = path.join(__dirname, '..', 'dist');

  log('Analyzing backend distribution...', 'yellow');
  const { files, testFiles, totalSize, testSize } = analyzeDirectory(backendDistPath);

  if (files.length === 0 && testFiles.length === 0) {
    log('', 'cyan');
    log('❌ No distribution files found', 'red');
    log(`   Expected: ${backendDistPath}`, 'red');
    log('   Run: npm run build', 'yellow');
    log('', 'cyan');
    process.exit(1);
  }

  // Sort by size descending
  files.sort((a, b) => b.size - a.size);

  const totalSizeKB = formatSize(totalSize);
  const testSizeKB = formatSize(testSize);
  const maxFileSize = files.length > 0 ? files[0].size : 0;
  const maxFileSizeKB = formatSize(maxFileSize);

  log('', 'cyan');
  log(`📊 Build Statistics:`, 'bright');
  log(`   Production Code:   ${totalSizeKB} KB`, totalSize > THRESHOLDS.maxBundleSize * 1024 ? 'red' : 'green');
  log(`   Test Files:        ${testSizeKB} KB (${testFiles.length} files)`, 'cyan');
  log(`   Total:             ${formatSize(totalSize + testSize)} KB`, 'cyan');
  log(`   Files (prod):      ${files.length}`, 'cyan');
  if (files.length > 0) {
    log(`   Largest File:      ${files[0].path} (${maxFileSizeKB} KB)`, maxFileSize > THRESHOLDS.maxIndividualFile * 1024 ? 'red' : 'green');
  }
  log('', 'cyan');

  // Check thresholds (excluding test files)
  let hasWarnings = false;
  let hasErrors = false;

  if (totalSize > THRESHOLDS.maxBundleSize * 1024) {
    log(`⚠️  WARNING: Production bundle size (${totalSizeKB} KB) exceeds threshold (${THRESHOLDS.maxBundleSize} KB)`, 'yellow');
    hasWarnings = true;
  }

  files.forEach((file) => {
    const fileSizeKB = formatSize(file.size);
    if (file.size > THRESHOLDS.maxIndividualFile * 1024) {
      log(`⚠️  WARNING: File ${file.path} (${fileSizeKB} KB) exceeds threshold (${THRESHOLDS.maxIndividualFile} KB)`, 'yellow');
      hasWarnings = true;
    }
  });

  // Show top production files
  if (files.length > 0) {
    log('', 'cyan');
    log('📈 Top 10 Production Files:', 'bright');
    log('', 'cyan');

    files.slice(0, 10).forEach((file, idx) => {
      const sizeKB = formatSize(file.size);
      const isLarge = file.size > THRESHOLDS.maxIndividualFile * 1024;
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
    log('  • Check for duplicate dependencies', 'yellow');
    log('  • Review unused imports', 'yellow');
    log('  • Enable code splitting where applicable', 'yellow');
    log('', 'cyan');
    process.exit(0);
  } else {
    log('✅ BUILD VERIFICATION PASSED', 'green');
    log('', 'cyan');
    process.exit(0);
  }
}

main();
