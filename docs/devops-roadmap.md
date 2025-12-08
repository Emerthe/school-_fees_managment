**DevOps Roadmap**

Phases:

1. Plan (this repo): choose stack, define SLA/SLO/error budget, docs
2. Code: git branching, PR template, implement CI-friendly app (this commit)
3. Build: CI pipeline (GitHub Actions), build artifacts, container image
4. Test: unit, integration, e2e, load/stress tests (k6 or Gatling)
5. Release: automated releases, container registry, tagging
6. Operate: monitoring (Prometheus + Grafana), logs (ELK or Loki), alerting
7. Scale: autoscaling, performance optimization, DB read replicas

Recommended tools by phase:
- CI: GitHub Actions or Jenkins
- Container: Docker, image scan with Trivy
- Testing: Jest (unit), Supertest (integration), k6 (load)
- Monitoring: Prometheus + Grafana; APM: Jaeger or Datadog
- Notifications: Slack webhook, email via SMTP or SES
