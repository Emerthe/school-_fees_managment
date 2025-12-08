# School Fees Manager

Node.js + Express app to manage student fees. Uses MySQL (Sequelize) in production and SQLite in tests.

Quick start

1. Copy `.env.example` to `.env` and set `DB_*` variables (or use a local MySQL instance).

2. Install and run locally:

```bash
npm ci
npm start
```

Run tests (uses in-memory SQLite):

```bash
npm test
```

Docker (build image):

```bash
docker build -t school-fees-manager:latest .
docker run -e DB_HOST=host.docker.internal -e DB_USER=root -e DB_PASS=... -e DB_NAME=school_fees_db -p 3000:3000 school-fees-manager:latest
```

Docs
- `docs/phase1-scope.md` - chosen scope and rationale
- `docs/devops-roadmap.md` - roadmap and tools
- `docs/error-budget.md` - error budget policy
# Updated
