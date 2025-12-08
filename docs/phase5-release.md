# Phase 5: Release - Versioning and Docker Registry

**Objective:** Implement professional-grade versioning, Git tagging, and Docker image management for production releases.

## Overview

Phase 5 establishes a complete release management pipeline:
- **Semantic Versioning** (SemVer): Major, minor, patch version management
- **Git Tagging**: Automated tag creation with version commits
- **Docker Registry Push**: Multi-registry support (Docker Hub, GitHub Container Registry, private registries)
- **GitHub Actions Automation**: Hands-off release workflow
- **Release Artifacts**: Trackable, versionable Docker images

## Architecture

```
Development Flow
├── Code changes on main/develop branches
├── Commit code
└── Create release tag (v1.0.0)
    └── GitHub Actions (Release workflow)
        ├── Tests run
        ├── Docker image built
        ├── Push to registries
        │   ├── Docker Hub
        │   └── GitHub Container Registry (GHCR)
        ├── Create GitHub Release
        └── Slack notification
            └── Production deployment ready
```

## Versioning Strategy

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR**: Breaking changes, incompatible API changes
  - Example: v1.0.0 → v2.0.0 (schema migration required)
- **MINOR**: Backward-compatible new features
  - Example: v1.0.0 → v1.1.0 (new student report feature)
- **PATCH**: Backward-compatible bug fixes
  - Example: v1.0.0 → v1.0.1 (payment calculation fix)

### Version Locations

```
package.json         ← Single source of truth
  └── "version": "1.0.0"
      └── Used by release scripts for tagging and Docker images
```

## Git Tagging Workflow

### Creating Releases

#### Manual Release (Local)

```bash
# Bump version and create tag
npm run release:patch   # v1.0.0 → v1.0.1
npm run release:minor   # v1.0.0 → v1.1.0
npm run release:major   # v1.0.0 → v2.0.0
```

**What happens:**
1. Version bumped in `package.json`
2. `package-lock.json` updated
3. Git commit created: `chore: release v1.0.1`
4. Git tag created: `v1.0.1` (annotated with release message)
5. Commits and tags pushed to origin
6. GitHub Actions Release workflow triggered
7. Tests run, Docker images built and pushed
8. GitHub Release page created with release notes

#### Custom Registry Release

```bash
# Release to private registry
npm run release:patch -- private.registry.com:5000
```

### Viewing Tags

```bash
# List local tags
git tag -l

# List tags with messages
git tag -l -n

# Show tag details
git show v1.0.0
```

## Docker Registry Integration

### Supported Registries

The release workflow automatically pushes to:

1. **Docker Hub** (if credentials configured)
   ```
   docker.io/username/school-fees-manager:1.0.0
   docker.io/username/school-fees-manager:latest
   ```

2. **GitHub Container Registry** (GHCR, automatic)
   ```
   ghcr.io/username/school-fees-manager:1.0.0
   ghcr.io/username/school-fees-manager:latest
   ```

3. **Private Registry** (via custom release script)
   ```bash
   node scripts/docker-release.js registry.example.com:5000 1.0.0
   ```

### Docker Image Tagging

Every release creates two tags:
- **Version tag**: `school-fees-manager:1.0.0` (immutable, specific release)
- **Latest tag**: `school-fees-manager:latest` (mutable, always points to newest)

Example:
```bash
docker pull emerthe/school-fees-manager:1.0.0  # Exact version
docker pull emerthe/school-fees-manager:latest  # Always latest
```

## GitHub Secrets Configuration

### Required Secrets for Docker Hub Push

1. Navigate to GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. Add these secrets:

   | Secret Name | Value | Example |
   |------------|-------|---------|
   | `DOCKER_USERNAME` | Your Docker Hub username | `emerthe` |
   | `DOCKER_PASSWORD` | Docker Hub personal access token | (create at https://hub.docker.com/settings/security) |
   | `SLACK_SECRET` | Slack webhook URL (already configured) | `https://hooks.slack.com/...` |

### Optional: Private Registry Credentials

For self-hosted registries, add:
- `REGISTRY_URL` - Registry endpoint
- `REGISTRY_USERNAME` - Registry credentials
- `REGISTRY_PASSWORD` - Registry credentials

### Generate Docker Hub Personal Access Token

1. Go to https://hub.docker.com/settings/security
2. Click **New Access Token**
3. Name it: `github-ci-release`
4. Set permissions: **Read, Write, Delete**
5. Copy token and paste into `DOCKER_PASSWORD` secret

## Release Workflow Files

### `scripts/version.js`

Handles semantic versioning:

```bash
node scripts/version.js patch    # Auto-bump patch version
node scripts/version.js minor    # Auto-bump minor version
node scripts/version.js major    # Auto-bump major version
```

**Operations:**
- Bumps version in `package.json`
- Creates Git commit with version bump
- Creates annotated Git tag
- Pushes to origin

### `scripts/docker-release.js`

Builds and pushes Docker images:

```bash
node scripts/docker-release.js docker.io/emerthe 1.0.0
```

**Operations:**
- Builds Docker image with version tag
- Builds with `latest` tag
- Pushes both tags to registry

### `scripts/release.js`

Orchestrates complete release:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

**Operations:**
1. Runs `scripts/version.js` (version bump + git tag)
2. Runs `scripts/docker-release.js` (Docker push)
3. Provides summary of release

### `.github/workflows/release.yml`

GitHub Actions workflow triggered by version tags:

**Trigger:** Any commit tagged with `v*` (v1.0.0, v1.0.1, etc.)

**Jobs:**
1. Checkout code at tagged commit
2. Install dependencies
3. Run full test suite
4. Extract version from tag
5. Log in to Docker registries
6. Build and push to Docker Hub
7. Build and push to GitHub Container Registry
8. Create GitHub Release with notes
9. Send Slack notification

## Quick Start: Release a Version

### Step 1: Create Release Locally

```bash
cd /home/niyomwungeri/Documents/school_fees_management

# Create a patch release
npm run release:patch
```

### Step 2: Monitor GitHub Actions

- GitHub automatically detects the tag
- Release workflow starts automatically
- Watch at: https://github.com/Emerthe/school-_fees_managment/actions

### Step 3: Verify Release

**GitHub Releases Page:**
- Go to https://github.com/Emerthe/school-_fees_managment/releases
- See new release with Docker image links

**Docker Hub:**
```bash
docker pull emerthe/school-fees-manager:1.0.1
```

**GitHub Container Registry:**
```bash
docker pull ghcr.io/emerthe/school-fees-manager:1.0.1
```

## Best Practices

### 1. Version Incrementing

```bash
# For minor bug fixes
npm run release:patch   # v1.0.0 → v1.0.1

# For new features (backward compatible)
npm run release:minor   # v1.0.0 → v1.1.0

# For breaking changes
npm run release:major   # v1.0.0 → v2.0.0
```

### 2. Commit Before Release

Always ensure working tree is clean:
```bash
git status              # Should show "nothing to commit"
git log --oneline -1    # See latest commit
```

### 3. Release Only from main

Tag releases only on the `main` branch:
```bash
git checkout main
git pull origin main
npm run release:patch
```

### 4. Monitor Release Workflow

```bash
# View all tags
git tag -l

# See tag commit and message
git show v1.0.1

# View GitHub Actions workflow
# https://github.com/Emerthe/school-_fees_managment/actions
```

### 5. Rollback if Needed

If release workflow fails:

```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :v1.0.1

# Reset version in package.json
git reset --hard HEAD~1

# Fix issue and try again
```

## Deployment Options

### Option 1: Docker Compose (Development)

```bash
docker-compose up
```

### Option 2: Docker Run (Production)

```bash
docker run -d \
  --name school-fees-manager \
  -p 3000:8080 \
  -e DB_HOST=mysql.example.com \
  -e DB_USER=sf_user \
  -e DB_PASS=secure_password \
  -e DB_NAME=school_fees_db \
  emerthe/school-fees-manager:1.0.1
```

### Option 3: Kubernetes (Enterprise)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-fees-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: school-fees-manager
  template:
    metadata:
      labels:
        app: school-fees-manager
    spec:
      containers:
      - name: app
        image: emerthe/school-fees-manager:1.0.1
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          value: mysql-service
```

## Troubleshooting

### Issue: Release script fails at Git push

**Cause:** No push permissions or authentication error

**Solution:**
```bash
# Verify remote
git remote -v

# Test authentication
git fetch

# If HTTPS, ensure credentials cached:
git config --global credential.helper store
```

### Issue: Docker push fails

**Cause:** Not logged in to registry or wrong credentials

**Solution:**
```bash
# Log in to Docker Hub
docker login

# Log in to private registry
docker login registry.example.com

# Verify connection
docker push emerthe/school-fees-manager:test
```

### Issue: GitHub Actions Release workflow doesn't run

**Cause:** Tag doesn't match pattern or workflow not enabled

**Solution:**
```bash
# Verify tag format
git tag -l            # Must show v-prefixed tags

# Enable workflow in GitHub Actions tab
# Check .github/workflows/release.yml exists

# Manually trigger if needed:
# GitHub repo → Actions → Release → Run workflow
```

### Issue: Docker image not pushed to all registries

**Cause:** Missing credentials for one registry

**Solution:**
1. Check GitHub Secrets are set correctly
2. Verify Docker Hub token is valid (regenerate if needed)
3. View GitHub Actions workflow logs for errors:
   - https://github.com/Emerthe/school-_fees_managment/actions

## Next Steps

1. **Configure Docker Hub credentials**
   - Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets

2. **Test release workflow**
   - Create a test release: `npm run release:patch`
   - Monitor GitHub Actions

3. **Verify Docker images**
   - Pull from Docker Hub: `docker pull emerthe/school-fees-manager:1.0.1`
   - Pull from GHCR: `docker pull ghcr.io/emerthe/school-fees-manager:1.0.1`

4. **Document in wiki**
   - Add release process to team documentation
   - Link to this phase doc

5. **Deploy to staging**
   - Use released Docker image in staging environment
   - Verify functionality before production

## Summary

Phase 5 provides:
- ✅ Semantic versioning (major, minor, patch)
- ✅ Automated Git tagging
- ✅ Multi-registry Docker push (Docker Hub, GHCR)
- ✅ GitHub Actions release workflow
- ✅ Automated release notes
- ✅ Slack notifications
- ✅ Easy rollback procedures
- ✅ Production-ready deployment artifacts

Release management is now fully automated. Simply run `npm run release:patch`, and the system handles versioning, tagging, testing, Docker builds, registry pushes, and release notifications.
