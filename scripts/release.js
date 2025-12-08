#!/usr/bin/env node

/**
 * Release Management Script
 * Orchestrates full release workflow: version bump, tagging, and Docker push
 * Usage: npm run release [major|minor|patch] [registry]
 * Example: npm run release minor docker.io/emerthe
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , versionType = 'patch', registry = 'docker.io/emerthe'] = process.argv;

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('Invalid version type. Use: major, minor, or patch');
  process.exit(1);
}

const packagePath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

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

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  RELEASE ORCHESTRATION                               ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log(`Current version: ${pkg.version}`);
console.log(`Release type:    ${versionType}`);
console.log(`New version:     ${newVersion}`);
console.log(`Registry:        ${registry}`);
console.log('');

try {
  // Step 1: Version bump with Git tag
  console.log('📋 Step 1: Version bump and Git tagging...');
  execSync(`node ${path.join(__dirname, 'version.js')} ${versionType}`, {
    stdio: 'inherit',
  });

  // Step 2: Docker build and push
  console.log('\n🐳 Step 2: Building and pushing Docker image...');
  execSync(`node ${path.join(__dirname, 'docker-release.js')} ${registry} ${newVersion}`, {
    stdio: 'inherit',
  });

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  RELEASE SUCCESSFUL ✅                               ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`\nVersion:   v${newVersion}`);
  console.log(`Git tag:   v${newVersion}`);
  console.log(`Docker:    ${registry}/school-fees-manager:${newVersion}`);
  console.log(`Latest:    ${registry}/school-fees-manager:latest`);
  console.log(`\nNext steps:`);
  console.log('1. GitHub Actions will build and test the tagged commit');
  console.log('2. Monitor the deployment on GitHub Actions');
  console.log('3. Verify Docker image in registry');
} catch (error) {
  console.error('\n✗ Release failed:', error.message);
  console.error('\nManual recovery:');
  console.error('1. Check Git status: git status');
  console.error('2. View recent commits: git log --oneline -5');
  console.error('3. Revert if needed: git reset --hard HEAD~1');
  process.exit(1);
}
