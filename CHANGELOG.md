# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-08

### Added

- ✅ School Fees Manager application with student management
- ✅ REST API for student CRUD operations
- ✅ Payment tracking and balance calculations
- ✅ Interactive HTML5 dashboard with real-time updates
- ✅ Docker containerization with multi-stage builds
- ✅ Docker Compose local development environment
- ✅ MySQL database with Sequelize ORM
- ✅ Comprehensive test suite with Jest
- ✅ GitHub Actions CI/CD pipeline
- ✅ Slack notifications for build status
- ✅ Semantic versioning system
- ✅ Automated Git tagging
- ✅ Docker Hub and GitHub Container Registry integration
- ✅ Automated release workflow with GitHub Actions
- ✅ Release notes generation
- ✅ Multi-registry Docker image distribution

### Infrastructure

- Node.js 20 runtime
- Express 4.18.2 web framework
- Sequelize 6.32.1 ORM
- MySQL 8.0.44 database
- Jest 29.6.1 testing framework
- Docker multi-stage builds
- GitHub Actions automation

### Documentation

- Phase 1: Scope & Requirements
- Phase 2: Architecture & Setup
- Phase 3: Development
- Phase 4: Testing
- Phase 5: Release & Versioning

---

## Release Process

To create a new release:

```bash
npm run release:patch   # v1.0.0 → v1.0.1
npm run release:minor   # v1.0.0 → v1.1.0
npm run release:major   # v1.0.0 → v2.0.0
```

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

## Distribution

Released versions are available in:

- **GitHub Releases**: https://github.com/Emerthe/school-_fees_managment/releases
- **Docker Hub**: https://hub.docker.com/r/emerthe/school-fees-manager
- **GitHub Container Registry**: https://github.com/Emerthe/school-_fees_managment/pkgs/container/school-fees-manager

## Docker Images

Pull released versions:

```bash
# Latest version
docker pull emerthe/school-fees-manager:latest

# Specific version
docker pull emerthe/school-fees-manager:1.0.0

# From GitHub Container Registry
docker pull ghcr.io/emerthe/school-fees-manager:1.0.0
```
