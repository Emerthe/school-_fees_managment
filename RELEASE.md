# Release Management Quick Reference

## One-Command Release

```bash
npm run release:patch   # Releases v1.0.1 (patch version bump)
npm run release:minor   # Releases v1.1.0 (minor version bump)
npm run release:major   # Releases v2.0.0 (major version bump)
```

## What Happens During Release

1. **Version Bump** → `package.json` updated, Git commit created
2. **Git Tag** → Annotated tag created with release notes
3. **Push** → Commits and tags pushed to GitHub
4. **GitHub Actions** → Release workflow automatically triggered
5. **Tests** → Full test suite runs
6. **Docker Build** → Image built with version tag
7. **Registry Push** → Pushed to Docker Hub and GitHub Container Registry
8. **Release Notes** → GitHub Release page created with Docker image links
9. **Slack Alert** → Notification sent to Slack channel

## Before Your First Release

### 1. Configure Docker Hub Credentials

**GitHub Secrets Setup:**
- Repo → Settings → Secrets and variables → Actions
- Add `DOCKER_USERNAME` → Your Docker Hub username
- Add `DOCKER_PASSWORD` → Docker Hub personal access token

**Generate Docker Hub Personal Access Token:**
1. Visit https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: `github-ci-release`
4. Permissions: Read, Write, Delete
5. Copy token → paste as `DOCKER_PASSWORD` secret

### 2. Verify All Tests Pass

```bash
npm test
```

### 3. Commit All Changes

```bash
git status                  # Ensure clean working tree
git log --oneline -1        # See latest commit
```

## Release Examples

### Example 1: Patch Release (Bug Fix)

```bash
cd /home/niyomwungeri/Documents/school_fees_management
npm run release:patch

# Process:
# - v1.0.0 → v1.0.1
# - Automatically pushed as tag v1.0.1
# - Docker image built: school-fees-manager:1.0.1
# - GitHub Release created
# - Slack notification sent
```

### Example 2: Minor Release (New Feature)

```bash
npm run release:minor

# Process:
# - v1.0.0 → v1.1.0
# - New features in this version
# - Docker image: school-fees-manager:1.1.0
# - GitHub Release with feature notes
```

### Example 3: Major Release (Breaking Changes)

```bash
npm run release:major

# Process:
# - v1.0.0 → v2.0.0
# - Breaking changes documented
# - Docker image: school-fees-manager:2.0.0
# - GitHub Release with migration guide
```

## Monitoring a Release

### Check GitHub Actions

```
GitHub Repo → Actions tab → Release workflow
```

**Expected stages:**
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run tests
4. ✅ Build Docker image
5. ✅ Push to Docker Hub
6. ✅ Push to GitHub Container Registry
7. ✅ Create release
8. ✅ Slack notification

### Verify Docker Image

```bash
# Check Docker Hub
docker pull emerthe/school-fees-manager:1.0.1

# Check GitHub Container Registry
docker pull ghcr.io/emerthe/school-fees-manager:1.0.1

# View available tags
docker images emerthe/school-fees-manager
```

### Check GitHub Release

Visit: https://github.com/Emerthe/school-_fees_managment/releases

See:
- Release title and description
- Docker image pull commands
- Release date and commit reference
- Downloadable assets

## Manual Release Commands

If you prefer more control:

### Step 1: Version Bump with Git Tag

```bash
node scripts/version.js patch    # Or minor/major
```

**This:**
- Updates `package.json` version
- Creates Git commit with version bump
- Creates and pushes annotated tag
- Triggers release workflow

### Step 2: Push Docker to Specific Registry

```bash
# Docker Hub
node scripts/docker-release.js docker.io/emerthe 1.0.1

# GitHub Container Registry (if using private)
node scripts/docker-release.js ghcr.io/emerthe 1.0.1

# Private registry
node scripts/docker-release.js registry.company.com:5000 1.0.1
```

## Checking Release Status

### View All Tags

```bash
git tag -l              # List all tags
git tag -l -n 1         # List with messages
git show v1.0.1         # Show tag details
```

### View Release Commits

```bash
git log --oneline v1.0.0..v1.0.1   # Commits since v1.0.0
git log --tags                      # All tagged commits
```

### View Docker Images Locally

```bash
docker images | grep school-fees-manager
docker pull emerthe/school-fees-manager:1.0.1
docker run emerthe/school-fees-manager:1.0.1
```

## Troubleshooting

### Error: "nothing to commit, working tree clean"

**Cause:** No changes since last commit

**Solution:**
```bash
# Make changes to code
git add .
git commit -m "Your changes"
# Then run release
npm run release:patch
```

### Error: Release script fails at git push

**Cause:** Git authentication issue

**Solution:**
```bash
# Test authentication
git fetch

# If HTTPS, configure credentials
git config --global credential.helper store
git pull

# Retry release
npm run release:patch
```

### Error: Docker push fails

**Cause:** Not logged in to registry

**Solution:**
```bash
# Log in to Docker Hub
docker login

# Enter Docker Hub username and personal access token
# Verify connection
docker push emerthe/school-fees-manager:test

# Retry release
npm run release:patch
```

### Error: GitHub Actions release workflow doesn't trigger

**Cause:** Tag doesn't match pattern or workflow disabled

**Solution:**
```bash
# Verify tag format (must start with 'v')
git tag -l

# If tag is wrong, delete and recreate
git tag -d v1.0.1
git push origin :v1.0.1

# Create correct tag and push
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# Check GitHub Actions is enabled
# Repo → Actions → Release workflow should show
```

## Rollback a Release

### If Release Failed

```bash
# Delete the tag locally
git tag -d v1.0.1

# Delete from GitHub
git push origin :v1.0.1

# Reset version in package.json
git reset --hard HEAD~1

# Fix the issue and try again
npm run release:patch
```

### If Release Was Successful But Has Issues

```bash
# Create a patch release to fix it
npm run release:patch    # v1.0.1 → v1.0.2

# Or delete and redo
git tag -d v1.0.1
git push origin :v1.0.1
git reset --hard HEAD~1
npm run release:patch
```

## Production Deployment

### Deploy Docker Image

**Single Container:**
```bash
docker run -d \
  --name school-fees-manager \
  -p 3000:8080 \
  -e DB_HOST=mysql.prod.com \
  -e DB_USER=sf_user \
  -e DB_PASS=secure_password \
  -e DB_NAME=school_fees_db \
  emerthe/school-fees-manager:1.0.1
```

**Docker Compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Kubernetes:**
```bash
kubectl create deployment school-fees \
  --image=emerthe/school-fees-manager:1.0.1
```

## Success Checklist

After running `npm run release:patch`:

- ✅ Version bumped in `package.json`
- ✅ Git commit created: `chore: release v1.0.1`
- ✅ Git tag created: `v1.0.1`
- ✅ Changes pushed to `origin/main`
- ✅ Tag pushed to GitHub
- ✅ GitHub Actions Release workflow triggered
- ✅ Tests pass (check Actions tab)
- ✅ Docker image built
- ✅ Docker image pushed to registry
- ✅ GitHub Release created with notes
- ✅ Slack notification sent
- ✅ Docker image available via `docker pull emerthe/school-fees-manager:1.0.1`

## Key Files

| File | Purpose |
|------|---------|
| `scripts/version.js` | Bumps version and creates Git tag |
| `scripts/docker-release.js` | Builds and pushes Docker image |
| `scripts/release.js` | Orchestrates complete release |
| `.github/workflows/release.yml` | GitHub Actions release automation |
| `package.json` | Version source of truth |
| `CHANGELOG.md` | Release history |
| `docs/phase5-release.md` | Detailed release documentation |

## Support

For detailed information, see:
- `docs/phase5-release.md` - Complete Phase 5 documentation
- `CHANGELOG.md` - Version history
- GitHub Actions logs - Real-time build status
- GitHub Releases - Release history and artifacts
