**Error Budget Policy**

Target availability: 99.9% (monthly)

- Allowed downtime per month: ~43.8 minutes (0.1% of 30 days)
- If error budget is consumed > 50% in a rolling 7-day window, suspend feature launches and prioritize reliability fixes

Measurement and alerts:
- Track successful requests vs errors in Prometheus (SLO: 99.9% success rate)
- Alert on 5-minute error rate spike and on approaching 80% of error budget

Post-incident:
- Run a blameless postmortem for incidents consuming >10% of monthly error budget
