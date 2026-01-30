#!/usr/bin/env node

/**
 * Console.log Migration Script
 * Automatically migrates console.log statements to structured logger
 * 
 * Usage:
 *   node scripts/migrate-console-logs.js [--dry-run] [--file path/to/file.ts]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.indexOf('--file');
const targetFile = fileArg !== -1 ? args[fileArg + 1] : null;

console.log('Console.log Migration Script');
console.log('============================\n');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

/**
 * Get all TypeScript files
 */
function getTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .next, tests, etc.
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(entry.name)) {
        getTypeScriptFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && 
          !entry.name.endsWith('.test.ts') && 
          !entry.name.endsWith('.test.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Detect component name from file path or content
 */
function detectComponentName(filePath, content) {
  // Try to extract from file path
  const pathParts = filePath.split(path.sep);
  const fileName = pathParts[pathParts.length - 1].replace(/\.(ts|tsx)$/, '');
  
  // Convert to PascalCase
  const componentName = fileName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  return componentName || 'Unknown';
}

/**
 * Migrate console.log statements in a file
 */
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  const componentName = detectComponentName(filePath, content);
  let modified = false;
  
  // Check if logger is already imported
  const hasClientLogger = content.includes("from '@/lib/logger/client-logger'") || 
                          content.includes('from "@/lib/logger/client-logger"');
  const hasServerLogger = content.includes("from '@/lib/logger/server-logger'") || 
                          content.includes('from "@/lib/logger/server-logger"');
  
  // Determine if client or server side
  const isClientSide = content.includes('"use client"') || content.includes("'use client'");
  const isServerSide = !isClientSide || filePath.includes('/app/api/');
  
  // Add import if needed
  if (!hasClientLogger && !hasServerLogger) {
    if (isClientSide) {
      content = `import clientLogger from '@/lib/logger/client-logger';\n${content}`;
      modified = true;
    } else if (isServerSide && !filePath.includes('/middleware/')) {
      content = `import { createServerLogger } from '@/lib/logger/server-logger';\n\n` +
                `const logger = createServerLogger('${componentName}');\n${content}`;
      modified = true;
    }
  }
  
  // Count replacements
  let replacementCount = 0;
  
  // Replace console.log
  const logPattern = /console\.log\((.*?)\);/g;
  if (logPattern.test(content)) {
    replacementCount += (content.match(logPattern) || []).length;
  }
  
  // Note: We're not doing automatic replacement as it requires manual review
  // to determine proper context and metadata
  
  return {
    filePath,
    componentName,
    modified,
    needsManualReview: content.includes('console.log') || 
                       content.includes('console.error') || 
                       content.includes('console.warn'),
    consoleLogCount: (content.match(/console\.log\(/g) || []).length,
    consoleErrorCount: (content.match(/console\.error\(/g) || []).length,
    consoleWarnCount: (content.match(/console\.warn\(/g) || []).length,
  };
}

/**
 * Main migration process
 */
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  // Get files to process
  const files = targetFile 
    ? [targetFile]
    : getTypeScriptFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files\n`);
  
  const results = files.map(migrateFile);
  
  // Filter files that need migration
  const needsMigration = results.filter(r => 
    r.consoleLogCount > 0 || 
    r.consoleErrorCount > 0 || 
    r.consoleWarnCount > 0
  );
  
  console.log('\n📊 Migration Summary');
  console.log('===================\n');
  console.log(`Total files scanned: ${results.length}`);
  console.log(`Files needing migration: ${needsMigration.length}`);
  console.log(`Total console.log: ${needsMigration.reduce((sum, r) => sum + r.consoleLogCount, 0)}`);
  console.log(`Total console.error: ${needsMigration.reduce((sum, r) => sum + r.consoleErrorCount, 0)}`);
  console.log(`Total console.warn: ${needsMigration.reduce((sum, r) => sum + r.consoleWarnCount, 0)}`);
  
  if (needsMigration.length > 0) {
    console.log('\n📝 Files requiring migration:\n');
    
    for (const result of needsMigration.slice(0, 20)) {
      console.log(`  ${result.filePath}`);
      console.log(`    Component: ${result.componentName}`);
      console.log(`    console.log: ${result.consoleLogCount}`);
      console.log(`    console.error: ${result.consoleErrorCount}`);
      console.log(`    console.warn: ${result.consoleWarnCount}`);
      console.log('');
    }
    
    if (needsMigration.length > 20) {
      console.log(`  ... and ${needsMigration.length - 20} more files\n`);
    }
  }
  
  console.log('\n💡 Next Steps:');
  console.log('==============\n');
  console.log('1. Review files listed above');
  console.log('2. Manually replace console.log with logger.info/debug');
  console.log('3. Add proper context (component, action)');
  console.log('4. Add metadata for structured logging');
  console.log('5. Mask PII using maskPII() utility');
  console.log('\nSee docs/logging/MIGRATION.md for detailed guide');
}

// Run migration
try {
  main();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
