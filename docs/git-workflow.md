**Git Branching & Workflow**

Branches:
- `main`: production-ready releases only
- `develop`: integration branch for completed features
- `feature/*`: short-lived feature branches (e.g., `feature/add-payments-api`)

Pull Requests:
- Open PR from `feature/*` → `develop` or `develop` → `main` for releases
- Require at least one approving review before merge
- Use PR template describing what changed, risk, testing steps

Code review checklist:
- Runs and passes tests locally
- Code matches style and has no obvious security issues
- DB migrations/data changes are explained

Commit message standard:
- Use Conventional Commits: `type(scope): subject`
- Examples: `feat(api): add payment endpoint`, `fix(student): validate input`
