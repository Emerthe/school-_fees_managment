#!/usr/bin/env node

/**
 * Semantic Versioning Script
 * Manages version bumping: major, minor, patch
 * Usage: node scripts/version.js major|minor|patch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagePath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

const [, , versionType] = process.argv;

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('Usage: node scripts/version.js [major|minor|patch]');
  process.exit(1);
}

// Parse current version
const [major, minor, patch] = pkg.version.split('.').map(Number);

// Calculate new version
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${pkg.version} → ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log('✓ Updated package.json');

// Stage and commit
try {
  execSync('git add package.json package-lock.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
  console.log('✓ Created version commit');

  // Create and push tag
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });
  console.log(`✓ Created git tag: v${newVersion}`);

  execSync('git push origin main', { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  console.log('✓ Pushed commits and tags to origin');

  console.log(`\n✅ Release v${newVersion} complete!`);
  console.log(`   New version is live and tagged in Git.`);
} catch (error) {
  console.error('Error during release:', error.message);
  // Rollback version change
  pkg.version = `${major}.${minor}.${patch}`;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.error('✗ Rolled back version change due to error');
  process.exit(1);
}
