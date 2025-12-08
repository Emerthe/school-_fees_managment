# Phase 4: Test – Comprehensive Testing & Notifications

## Overview
Phase 4 implements unit tests, integration tests, automated CI test execution, and feedback mechanisms (Slack + email notifications) for the School Fees Manager API.

---

## Test Coverage

### Unit Tests
Located in `tests/test_students.test.js`, using **Jest** and **Supertest**:

#### POST /student
- ✅ Creates a student with valid data (name, fees)
- ❌ Returns 500 when name is missing
- ❌ Returns 500 when fees is missing

#### GET /students
- ✅ Returns all students as an array
- ✅ Array contains correct student records

#### GET /student/:id
- ✅ Retrieves a student by ID
- ❌ Returns 404 for non-existent student

#### PUT /student/:id/pay
- ✅ Records a payment and updates `feePaid`
- ✅ Accumulates multiple payments correctly
- ❌ Returns 404 when student not found
- ✅ Handles zero and negative amounts (edge cases)

### Integration Tests
Full workflow scenarios:
- Create a student → Pay fees multiple times → Verify final balance

---

## Running Tests Locally

```bash
# Install dependencies
npm ci

# Run all tests (in-memory SQLite DB)
npm test

# Run tests in watch mode (on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

---

## CI/CD Test Automation

### GitHub Actions Workflow
File: `.github/workflows/ci.yml`

**Trigger:** On push to `main` or `develop`, and on pull requests.

**Steps:**
1. Checkout code
2. Setup Node.js (v20)
3. Cache npm modules
4. Install dependencies (`npm ci`)
5. Run tests (`npm test`)
6. Build Docker image
7. Send notifications (Slack + email)

---

## Notification Mechanisms

### 1. Slack Notifications
**Location:** `utils/notifications.js` → `sendSlackNotification()`

**Setup:**
1. Create a Slack App and Incoming Webhook: https://api.slack.com/apps
2. Add webhook URL as GitHub secret: `SLACK_WEBHOOK_URL`
3. Workflow will post pass/fail status with repo, branch, commit info

**Example message:**
```
✅ CI Build SUCCESS
Repository: owner/school-fees-manager
Branch: refs/heads/develop
Commit: abc12345
Status: success
```

---

### 2. Email Notifications
**Location:** `utils/notifications.js` → `sendEmailNotification()`

**Setup:**
1. Create a Gmail App Password (if using Gmail):
   - Enable 2FA on your Google account
   - Go to myaccount.google.com → Security → App passwords
   - Generate password for "Mail" on "Windows PC"
2. Add these as GitHub secrets:
   - `EMAIL_USER` – your email address (e.g., `your-email@gmail.com`)
   - `EMAIL_PASS` – app password from step 1
   - `EMAIL_RECIPIENT` – recipient email
   - `EMAIL_HOST` (optional) – SMTP server (default: `smtp.gmail.com`)
3. Workflow will send HTML email with build status

**Example email:**
```
✅ Build Status: SUCCESS - owner/school-fees-manager

Repository: owner/school-fees-manager
Branch: refs/heads/develop
Commit: abc12345
Status: success

View the full build log on GitHub Actions.
```

---

## Configuring Secrets in GitHub

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret:

| Secret Name | Value |
|---|---|
| `SLACK_WEBHOOK_URL` | Your Slack incoming webhook URL |
| `EMAIL_USER` | your-email@gmail.com |
| `EMAIL_PASS` | App-specific password (not your Google password) |
| `EMAIL_RECIPIENT` | admin@example.com |
| `EMAIL_HOST` | smtp.gmail.com (or your SMTP server) |

---

## Test Results & Reports

### JSON Report (via Jest)
```bash
npm test -- --json --outputFile=test-report.json
```

### Coverage Report
```bash
npm test -- --coverage
```

Creates `coverage/` directory with HTML coverage report.

---

## Load & Stress Testing (Future Phase)

Consider adding **k6** for load testing:
```bash
npm install -D k6
```

Example load test script (`tests/load-test.js`):
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  let res = http.get('http://localhost:3000/students');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

Run with: `k6 run tests/load-test.js`

---

## Monitoring Failed Transactions

For production, integrate:
- **Prometheus** for metrics collection
- **Grafana** for dashboards and alerts
- **APM tools** (Jaeger, Datadog) for request tracing

Example metric to track:
```
payment_success_rate = (successful_payments / total_payment_requests) * 100
```

Alert when `payment_success_rate < 99%` for 5 minutes.

---

## Summary

Phase 4 provides:
✅ 15+ unit and integration tests  
✅ Automated CI test execution (GitHub Actions)  
✅ Slack webhook notifications  
✅ Email notifications (SMTP/Gmail)  
✅ Test coverage metrics  
✅ Foundation for load/stress testing  
