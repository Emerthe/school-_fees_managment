#!/usr/bin/env node

/**
 * Docker Registry Push Script
 * Builds and pushes Docker image to registry
 * Supports Docker Hub and custom registries
 * Usage: node scripts/docker-release.js [registry] [version]
 * Examples:
 *   node scripts/docker-release.js docker.io/emerthe 0.1.0
 *   node scripts/docker-release.js 192.168.1.1:5000 0.1.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , registry = 'docker.io/emerthe', version] = process.argv;

if (!version) {
  console.error('Usage: node scripts/docker-release.js [registry] [version]');
  console.error('Example: node scripts/docker-release.js docker.io/emerthe 0.1.0');
  process.exit(1);
}

const imageName = 'school-fees-manager';
const imageTag = `${registry}/${imageName}:${version}`;
const latestTag = `${registry}/${imageName}:latest`;

console.log(`🐳 Building Docker image: ${imageTag}`);
console.log(`   Latest tag: ${latestTag}`);

try {
  // Build image
  execSync(`docker build -t ${imageTag} -t ${latestTag} .`, {
    stdio: 'inherit',
  });
  console.log('✓ Docker image built successfully');

  // Push versioned tag
  console.log(`\n📤 Pushing image to registry...`);
  execSync(`docker push ${imageTag}`, { stdio: 'inherit' });
  console.log(`✓ Pushed ${imageTag}`);

  // Push latest tag
  execSync(`docker push ${latestTag}`, { stdio: 'inherit' });
  console.log(`✓ Pushed ${latestTag}`);

  console.log(`\n✅ Release complete!`);
  console.log(`   Versioned image: ${imageTag}`);
  console.log(`   Latest image:    ${latestTag}`);
  console.log(`   Pull with: docker pull ${imageTag}`);
} catch (error) {
  console.error('\n✗ Docker push failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Ensure Docker daemon is running: docker ps');
  console.error('2. Log in to registry: docker login [registry-url]');
  console.error('3. For Docker Hub: docker login (no URL needed)');
  console.error('4. Check registry credentials and permissions');
  process.exit(1);
}
