#!/usr/bin/env node

/**
 * Asset Audit Tool
 * 
 * Safely audits project assets and generates a comprehensive report without
 * modifying any files. Reports on:
 * - All image/audio assets in the project
 * - Where each asset is referenced in source files
 * - Potentially unreferenced assets
 * - Large assets that may affect mobile load time
 * - Duplicate or near-duplicate filenames
 * - Suspected old/placeholder/low-res assets based on naming patterns
 * 
 * Do NOT delete, rename, compress, or replace any assets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the repository
const REPO_ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR = path.join(REPO_ROOT, 'artifacts', 'shattered-veil');
const REPORT_OUTPUT = path.join(ARTIFACT_DIR, 'ASSET_AUDIT.md');

// Asset directories to scan
const ASSET_DIRS = [
  path.join(ARTIFACT_DIR, 'public'),
];

// Source directories to scan for references
const SOURCE_DIRS = [
  path.join(ARTIFACT_DIR, 'src'),
];

// File extensions for assets
const ASSET_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp3', '.wav', '.ogg', '.m4a'];

// Keywords indicating old/placeholder/temp assets
const SUSPICIOUS_KEYWORDS = ['old', 'temp', 'placeholder', 'low', 'draft', 'copy', 'backup', 'test', 'tmp'];

// Size threshold for "large" assets (in bytes) - 500 KB
const LARGE_ASSET_THRESHOLD = 500 * 1024;

/**
 * Recursively find all files in a directory
 */
function findFiles(dir, extensions = null) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...findFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        if (!extensions || extensions.includes(path.extname(entry.name).toLowerCase())) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
  }
  
  return files;
}

/**
 * Find all asset files
 */
function findAssets() {
  const assets = [];
  
  for (const dir of ASSET_DIRS) {
    const files = findFiles(dir, ASSET_EXTENSIONS);
    assets.push(...files);
  }
  
  return assets.sort();
}

/**
 * Find all source files (JS, TS, JSX, TSX, etc.)
 */
function findSourceFiles() {
  const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
  const sourceFiles = [];
  
  for (const dir of SOURCE_DIRS) {
    const files = findFiles(dir, sourceExtensions);
    sourceFiles.push(...files);
  }
  
  return sourceFiles;
}

/**
 * Read all source files and find asset references
 */
function findAssetReferences(assets, sourceFiles) {
  const references = new Map();
  
  // Initialize map with all assets
  for (const asset of assets) {
    references.set(asset, []);
  }
  
  // Search for references in source files
  for (const sourceFile of sourceFiles) {
    try {
      const content = fs.readFileSync(sourceFile, 'utf-8');
      
      for (const asset of assets) {
        const filename = path.basename(asset);
        const baseName = path.parse(filename).name;
        
        // Search for:
        // 1. Exact filename
        // 2. Base name without extension
        // 3. Common import patterns
        const patterns = [
          new RegExp(`['"\`]([^'"\`]*${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'"\`]*)['"\`]`),
          new RegExp(`['"\`]([^'"\`]*${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'"\`]*)['"\`]`),
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            const refsArray = references.get(asset) || [];
            if (!refsArray.includes(sourceFile)) {
              refsArray.push(sourceFile);
            }
            references.set(asset, refsArray);
          }
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not read source file ${sourceFile}: ${err.message}`);
    }
  }
  
  return references;
}

/**
 * Identify suspicious assets based on filename patterns
 */
function identifySuspiciousAssets(assets) {
  const suspicious = [];
  
  for (const asset of assets) {
    const filename = path.basename(asset).toLowerCase();
    const hasSuspiciousKeyword = SUSPICIOUS_KEYWORDS.some(keyword => filename.includes(keyword));
    
    if (hasSuspiciousKeyword) {
      suspicious.push(asset);
    }
  }
  
  return suspicious;
}

/**
 * Find duplicate or near-duplicate filenames
 */
function findDuplicates(assets) {
  const nameMap = new Map();
  const duplicates = [];
  
  for (const asset of assets) {
    const filename = path.basename(asset);
    const baseName = path.parse(filename).name.toLowerCase();
    
    if (!nameMap.has(baseName)) {
      nameMap.set(baseName, []);
    }
    nameMap.get(baseName).push(asset);
  }
  
  for (const [baseName, files] of nameMap) {
    if (files.length > 1) {
      duplicates.push({
        baseName,
        files,
      });
    }
  }
  
  return duplicates.sort((a, b) => a.baseName.localeCompare(b.baseName));
}

/**
 * Find large assets
 */
function findLargeAssets(assets) {
  const large = [];
  
  for (const asset of assets) {
    try {
      const stat = fs.statSync(asset);
      if (stat.size > LARGE_ASSET_THRESHOLD) {
        large.push({
          asset,
          size: stat.size,
          sizeKB: (stat.size / 1024).toFixed(2),
        });
      }
    } catch (err) {
      console.warn(`Warning: Could not stat file ${asset}: ${err.message}`);
    }
  }
  
  return large.sort((a, b) => b.size - a.size);
}

/**
 * Format file path relative to repo root for display
 */
function formatPath(fullPath) {
  return path.relative(REPO_ROOT, fullPath);
}

/**
 * Generate markdown report
 */
function generateReport(assets, references, suspicious, duplicates, large) {
  const referenced = assets.filter(a => references.get(a).length > 0);
  const unreferenced = assets.filter(a => references.get(a).length === 0);
  
  let report = `# Asset Audit Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Status:** Read-only audit. No files were deleted, modified, renamed, or replaced.\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  report += `- **Total Assets:** ${assets.length}\n`;
  report += `- **Referenced Assets:** ${referenced.length}\n`;
  report += `- **Possibly Unreferenced:** ${unreferenced.length}\n`;
  report += `- **Large Assets (>${(LARGE_ASSET_THRESHOLD / 1024).toFixed(0)} KB):** ${large.length}\n`;
  report += `- **Suspected Old/Placeholder Assets:** ${suspicious.length}\n`;
  report += `- **Base Names with Duplicates:** ${duplicates.length}\n\n`;
  
  // Confirmed Referenced Assets
  report += `## ✅ Confirmed Referenced Assets (${referenced.length})\n\n`;
  report += `Assets found referenced in source code:\n\n`;
  
  if (referenced.length === 0) {
    report += `_None found._\n\n`;
  } else {
    for (const asset of referenced) {
      const relPath = formatPath(asset);
      const refs = references.get(asset);
      report += `### ${path.basename(asset)}\n`;
      report += `- **Path:** \`${relPath}\`\n`;
      report += `- **File Size:** ${(fs.statSync(asset).size / 1024).toFixed(2)} KB\n`;
      report += `- **Referenced in (${refs.length} file${refs.length !== 1 ? 's' : ''}):**\n`;
      for (const ref of refs) {
        report += `  - \`${formatPath(ref)}\`\n`;
      }
      report += `\n`;
    }
  }
  
  // Possibly Unreferenced Assets
  report += `## ⚠️ Possibly Unreferenced Assets (${unreferenced.length})\n\n`;
  report += `Assets not found in source code references. They may be:\n`;
  report += `- Used dynamically at runtime\n`;
  report += `- Referenced in configuration files\n`;
  report += `- Fallbacks or conditionally loaded\n`;
  report += `- No longer needed\n\n`;
  
  if (unreferenced.length === 0) {
    report += `_None found._\n\n`;
  } else {
    for (const asset of unreferenced) {
      const relPath = formatPath(asset);
      const sizeKB = (fs.statSync(asset).size / 1024).toFixed(2);
      const isSuspicious = suspicious.includes(asset);
      const tag = isSuspicious ? ' 🚩' : '';
      report += `- \`${relPath}\` (${sizeKB} KB)${tag}\n`;
    }
    report += `\n`;
  }
  
  // Large Assets
  report += `## 📦 Large Assets (>${(LARGE_ASSET_THRESHOLD / 1024).toFixed(0)} KB) - May Impact Mobile Load Time\n\n`;
  
  if (large.length === 0) {
    report += `_None found._\n\n`;
  } else {
    report += `| Asset | Size | Referenced? |\n`;
    report += `|-------|------|-------------|\n`;
    for (const item of large) {
      const relPath = formatPath(item.asset);
      const isReferenced = references.get(item.asset).length > 0 ? '✅ Yes' : '⚠️ Possibly not';
      report += `| \`${relPath}\` | ${item.sizeKB} KB | ${isReferenced} |\n`;
    }
    report += `\n`;
  }
  
  // Duplicate/Near-Duplicate Filenames
  report += `## 🔄 Duplicate or Near-Duplicate Base Names (${duplicates.length})\n\n`;
  report += `Base names that appear with different extensions or variations:\n\n`;
  
  if (duplicates.length === 0) {
    report += `_None found._\n\n`;
  } else {
    for (const dup of duplicates) {
      report += `### ${dup.baseName}\n`;
      for (const file of dup.files) {
        const relPath = formatPath(file);
        const isReferenced = references.get(file).length > 0 ? '✅' : '⚠️';
        report += `- ${isReferenced} \`${relPath}\`\n`;
      }
      report += `\n`;
    }
  }
  
  // Suspected Old/Placeholder/Low-Res Assets
  report += `## 🚩 Suspected Old/Placeholder/Low-Res/Temp Assets (${suspicious.length})\n\n`;
  report += `Assets matching patterns: ${SUSPICIOUS_KEYWORDS.map(k => `\`${k}\``).join(', ')}\n\n`;
  report += `**⚠️ These are not necessarily deletable—verify before cleanup!**\n\n`;
  
  if (suspicious.length === 0) {
    report += `_None found._\n\n`;
  } else {
    report += `| Asset | Size | Referenced? | Notes |\n`;
    report += `|-------|------|-------------|-------|\n`;
    for (const asset of suspicious) {
      const relPath = formatPath(asset);
      const sizeKB = (fs.statSync(asset).size / 1024).toFixed(2);
      const isReferenced = references.get(asset).length > 0 ? '✅ Yes' : '⚠️ Possibly not';
      const filename = path.basename(asset).toLowerCase();
      const matches = SUSPICIOUS_KEYWORDS.filter(k => filename.includes(k));
      const notes = matches.join(', ');
      report += `| \`${relPath}\` | ${sizeKB} KB | ${isReferenced} | ${notes} |\n`;
    }
    report += `\n`;
  }
  
  // High-Risk Assets
  report += `## 🛡️ High-Risk Assets (Do NOT Delete)\n\n`;
  report += `The following asset categories should NOT be deleted without careful review:\n\n`;
  report += `1. **Large referenced assets** - Removal may break core features\n`;
  report += `2. **Any PNG/JPG scene backgrounds** - Often used for scene rendering\n`;
  report += `3. **favicon.svg, opengraph.jpg** - Used for meta/branding\n`;
  report += `4. **Assets in root public folder** - Often dynamically referenced\n\n`;
  
  // High-risk items
  const highRiskItems = [];
  
  for (const item of large) {
    if (references.get(item.asset).length > 0) {
      highRiskItems.push(`- \`${formatPath(item.asset)}\` (${item.sizeKB} KB, referenced)`);
    }
  }
  
  // Scene backgrounds
  for (const asset of referenced) {
    const filename = path.basename(asset).toLowerCase();
    if (filename.includes('-arena') || filename.includes('-forest') || filename.includes('-rift') || 
        filename.includes('battle') || filename.includes('town') || filename.includes('forge')) {
      highRiskItems.push(`- \`${formatPath(asset)}\` (scene background, critical)`);
    }
  }
  
  if (highRiskItems.length === 0) {
    report += `_Review the categories above and audit any candidate assets manually._\n\n`;
  } else {
    for (const item of highRiskItems) {
      report += `${item}\n`;
    }
    report += `\n`;
  }
  
  // Recommended Next Steps
  report += `## 📋 Recommended Next Steps\n\n`;
  report += `1. **For Unreferenced Assets:**\n`;
  report += `   - Verify with dev team if any are used dynamically\n`;
  report += `   - Check configuration files and data files for references\n`;
  report += `   - Consider keeping until explicitly verified as unused\n\n`;
  
  report += `2. **For Large Assets:**\n`;
  report += `   - Evaluate if optimization (compression, resizing) is possible\n`;
  report += `   - Consider lazy-loading strategies for non-critical assets\n`;
  report += `   - Profile mobile load time impact\n\n`;
  
  report += `3. **For Suspected Old/Placeholder Assets:**\n`;
  report += `   - Manually verify each is truly obsolete\n`;
  report += `   - Check git history for context\n`;
  report += `   - Never delete without explicit approval\n\n`;
  
  report += `4. **Before Any Deletions:**\n`;
  report += `   - Create a backup branch\n`;
  report += `   - Test thoroughly after any removal\n`;
  report += `   - Document why each asset was removed\n`;
  report += `   - Update this audit report\n\n`;
  
  // Footer
  report += `---\n\n`;
  report += `**Note:** This is a read-only audit tool. It identifies potential optimization opportunities but makes no changes. `;
  report += `Any modifications to assets must be done manually and thoroughly tested.\n`;
  
  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Starting Asset Audit...\n');
  
  try {
    // Find assets
    console.log('📂 Scanning for assets...');
    const assets = findAssets();
    console.log(`   Found ${assets.length} assets.\n`);
    
    // Find source files
    console.log('📄 Scanning source files...');
    const sourceFiles = findSourceFiles();
    console.log(`   Found ${sourceFiles.length} source files.\n`);
    
    // Find references
    console.log('🔗 Analyzing asset references...');
    const references = findAssetReferences(assets, sourceFiles);
    console.log(`   Analysis complete.\n`);
    
    // Find suspicious assets
    console.log('🚩 Identifying suspicious assets...');
    const suspicious = identifySuspiciousAssets(assets);
    console.log(`   Found ${suspicious.length} suspicious assets.\n`);
    
    // Find duplicates
    console.log('🔄 Finding duplicate/near-duplicate names...');
    const duplicates = findDuplicates(assets);
    console.log(`   Found ${duplicates.length} base name duplicates.\n`);
    
    // Find large assets
    console.log('📦 Identifying large assets...');
    const large = findLargeAssets(assets);
    console.log(`   Found ${large.length} large assets.\n`);
    
    // Generate report
    console.log('📝 Generating report...');
    const report = generateReport(assets, references, suspicious, duplicates, large);
    
    // Write report
    fs.mkdirSync(path.dirname(REPORT_OUTPUT), { recursive: true });
    fs.writeFileSync(REPORT_OUTPUT, report);
    console.log(`   Report written to: ${formatPath(REPORT_OUTPUT)}\n`);
    
    // Summary
    console.log('✅ Asset audit complete!\n');
    console.log(`Summary:`);
    console.log(`  - Total assets: ${assets.length}`);
    console.log(`  - Referenced: ${assets.filter(a => references.get(a).length > 0).length}`);
    console.log(`  - Unreferenced: ${assets.filter(a => references.get(a).length === 0).length}`);
    console.log(`  - Large (>${(LARGE_ASSET_THRESHOLD / 1024).toFixed(0)} KB): ${large.length}`);
    console.log(`  - Suspicious: ${suspicious.length}\n`);
    
  } catch (error) {
    console.error('❌ Error during audit:', error.message);
    process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
