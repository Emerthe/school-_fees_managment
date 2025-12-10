# Phase 6: Deploy — Kubernetes CD Pipeline & Deployment Strategies

**Objective:** Implement a production-grade continuous deployment pipeline with zero-downtime rolling and blue-green strategies, resource management, and automated health checks.

## Overview

Phase 6 establishes Kubernetes-native deployment with:
- **Rolling updates** — gradually replace pods (zero downtime)
- **Blue-green deployments** — instant switchover with rollback capability
- **Autoscaling** — horizontal pod autoscaler based on CPU/memory
- **Resource limits** — CPU and memory requests/limits
- **Health checks** — liveness and readiness probes
- **Automated CD** — GitHub Actions workflow triggers on version tags

## Architecture

```
Git Tag (v1.0.2)
  ↓
GitHub Actions (deploy.yml)
  ├─→ Checkout code
  ├─→ Set up kubectl
  ├─→ Deploy to Kubernetes (rolling or blue-green)
  ├─→ Health checks & smoke tests
  └─→ Slack notification

Kubernetes Cluster
  ├─→ Namespace: school-fees-manager
  ├─→ Deployment (rolling-update or blue/green)
  ├─→ Service (LoadBalancer)
  ├─→ ConfigMap (app config)
  ├─→ Secret (sensitive data)
  ├─→ HPA (auto-scale)
  └─→ PDB (disruption budget)
```

## Deployment Strategies

### 1. Rolling Update (Recommended for gradual rollout)

**File:** `k8s/strategies/rolling-update.yml`

**How it works:**
- Start with 3 replica pods running version 1.0.0
- Gradually replace old pods with new version (1.0.1)
- Max 1 extra pod during update (4 pods max at peak)
- Zero unavailable pods (zero downtime)
- If new version fails, rollback is automatic

**Timeline (example):**
```
Time 0:   [v1.0.0] [v1.0.0] [v1.0.0]
Time 1:   [v1.0.0] [v1.0.0] [v1.0.0] [v1.0.1]  (4 pods)
Time 2:   [v1.0.0] [v1.0.0] [v1.0.1] [v1.0.1]
Time 3:   [v1.0.0] [v1.0.1] [v1.0.1] [v1.0.1]
Time 4:   [v1.0.1] [v1.0.1] [v1.0.1]           (back to 3)
```

**Advantages:**
- Zero downtime
- Resource-efficient (max 4 pods at peak)
- Automatic rollback on failure
- Can monitor metrics during rollout

**Disadvantages:**
- Slower update (5–10 minutes typically)
- Two versions running simultaneously
- Database migrations must be backward-compatible

**Command:**
```bash
kubectl apply -f k8s/strategies/rolling-update.yml
```

### 2. Blue-Green Deployment (For instant switchover)

**File:** `k8s/strategies/blue-green.yml`

**How it works:**
- Run two complete deployments: BLUE (stable) and GREEN (new)
- Service points to BLUE (live traffic)
- Deploy new version to GREEN in parallel
- Run smoke tests on GREEN
- Switch service selector from BLUE to GREEN (instant)
- If issues, switch back to BLUE (instant rollback)

**Timeline:**
```
Before:   BLUE [1.0.0] ← Service (live)    GREEN [1.0.0]
Deploy:   BLUE [1.0.0]    (idle)           GREEN [1.0.1] ← deploying
Test:     BLUE [1.0.0]    (live)           GREEN [1.0.1] ← testing
Switch:   BLUE [1.0.0]    (idle)           GREEN [1.0.1] ← Service (live)
```

**Advantages:**
- Instant switchover (no gradual transition)
- Instant rollback if issues detected
- Can run smoke tests before switching live traffic
- Old version available immediately if needed

**Disadvantages:**
- 2x resource usage during deployment (6 pods instead of 3–4)
- Requires more storage/compute resources
- Database schema changes still need care (backward-compatible)

**Command:**
```bash
# Deploy GREEN version
kubectl set image deployment/school-fees-manager-green \
  school-fees-manager=emerthe/school-fees-manager:1.0.1 \
  -n school-fees-manager

# Run smoke tests (manual step)
kubectl run test-pod --image=curlimages/curl --rm -it \
  -n school-fees-manager \
  -- curl http://school-fees-manager-blue-green:80/students

# Switch to GREEN
kubectl patch svc school-fees-manager-blue-green \
  -p '{"spec":{"selector":{"slot":"green"}}}' \
  -n school-fees-manager

# Rollback to BLUE (if needed)
kubectl patch svc school-fees-manager-blue-green \
  -p '{"spec":{"selector":{"slot":"blue"}}}' \
  -n school-fees-manager
```

## Resource Calculation

### Application Pod Resource Request/Limit

Based on typical School Fees Manager workload:

| Resource | Request | Limit | Rationale |
|---|---|---|---|
| CPU | 100m (0.1 cores) | 500m (0.5 cores) | Light API workload, burst on reports |
| Memory | 256 MB | 512 MB | Node.js ~100 MB base + buffers |
| Disk (ephemeral) | 500 MB | — | Logs, temp files |

### Per-Pod Resource Usage (actual)

```
Idle:     CPU ~10m,   Memory ~80 MB
Light:    CPU ~50m,   Memory ~150 MB
Normal:   CPU ~100m,  Memory ~250 MB
Spike:    CPU ~300m,  Memory ~350 MB (within limit)
```

### Cluster-Level Calculation (Example: 3 replicas)

| Metric | Per Pod | 3 Pods (non-HA) | 6 Pods (HA) | 10 Pods (max HPA) |
|---|---|---|---|---|
| CPU Requested | 100m | 300m (0.3 cores) | 600m (0.6 cores) | 1 core |
| CPU Limited | 500m | 1.5 cores | 3 cores | 5 cores |
| RAM Requested | 256 MB | 768 MB (0.75 GB) | 1.5 GB | 2.5 GB |
| RAM Limited | 512 MB | 1.5 GB | 3 GB | 5 GB |
| Disk | 500 MB | 1.5 GB | 3 GB | 5 GB |

### Node Requirements (Kubernetes Worker Node)

For 3 application pods + system components (etcd, kubelet, etc.):

| Component | CPU | Memory | Notes |
|---|---|---|---|
| App (3 pods) | 300m | 768 MB | Requested |
| System (kubelet, cAdvisor, etc.) | 100m | 500 MB | Typical overhead |
| Buffer (headroom) | 200m | 300 MB | For spikes |
| **Total per node** | **600m (0.6 core)** | **1.6 GB** | Minimum |

**Recommended node size:** 
- **Small cluster**: 2x 1-core, 2GB RAM (e.g., t3.micro)
- **Medium cluster**: 2x 2-core, 4GB RAM (e.g., t3.small)
- **Large cluster**: 4x 4-core, 8GB RAM (e.g., t3.medium)

### Autoscaling Configuration

**HorizontalPodAutoscaler (HPA) settings:**
- Min replicas: 2 (minimum availability)
- Max replicas: 10 (cost control)
- CPU target: 70% utilization
- Memory target: 80% utilization
- Scale up: 100% increase per 30s (up to +2 pods)
- Scale down: 50% decrease per 60s (1 pod every 60s)

**Example scaling scenario:**
```
Traffic surge (500 → 2000 req/s):
Time 0:    3 pods × 100m = 300m used (60% of 500m limit)
Time 1:    4 pods × 125m = 500m (100% limit hit) → HPA triggers
Time 2:    6 pods × 83m = ~500m (83% requested)    → Still below 70% target
Time 3:    8 pods × 62m = ~500m (62% requested)    → Below target, stable
Result:    Autoscale to 6-8 pods, handle spike
```

## Kubernetes Manifests

### Base Configuration (`k8s/base/namespace.yml`)
- Namespace creation
- ConfigMap (app configuration)
- Secret (database credentials, Slack webhook)
- Services (internal ClusterIP, external LoadBalancer)
- HPA (autoscaling rules)

### Rolling Update (`k8s/strategies/rolling-update.yml`)
- Deployment with `maxSurge: 1, maxUnavailable: 0`
- PodDisruptionBudget (min 2 pods available)
- Pod affinity (spread across nodes)
- Probes (liveness, readiness, startup)

### Blue-Green (`k8s/strategies/blue-green.yml`)
- Two Deployments (blue, green)
- Single Service with selector
- ServiceMonitor (Prometheus)

## GitHub Actions CD Pipeline

**File:** `.github/workflows/deploy.yml`

**Trigger:** On Git tag push (e.g., `git tag v1.0.2 && git push origin v1.0.2`)

**Steps:**
1. Checkout code
2. Extract version from tag
3. Set up kubectl + kubeconfig
4. Deploy (rolling or blue-green)
5. Health checks + smoke tests
6. Rollback on failure
7. Notify Slack

**Secrets required:**
- `KUBE_CONFIG` — base64-encoded kubeconfig file
- `SLACK_SECRET` — Slack webhook URL

**Environment variables:**
- GitHub Action environment: `production`

## Deploying to Kubernetes

### Prerequisites

1. **Kubernetes cluster running:**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

2. **kubeconfig configured:**
   ```bash
   export KUBECONFIG=~/.kube/config
   kubectl auth can-i get deployments --as=<user>
   ```

3. **Docker image available in registry:**
   ```bash
   docker pull emerthe/school-fees-manager:1.0.0
   ```

4. **Namespace and secrets created:**
   ```bash
   kubectl create namespace school-fees-manager
   kubectl create secret generic sfm-secrets \
     --from-literal=DB_USER=sf_user \
     --from-literal=DB_PASS=<password> \
     --from-literal=SLACK_SECRET=<webhook> \
     -n school-fees-manager
   ```

### Manual Deployment (Rolling Update)

```bash
# Apply base configuration
kubectl apply -f k8s/base/namespace.yml

# Deploy rolling update strategy
kubectl apply -f k8s/strategies/rolling-update.yml

# Check deployment status
kubectl get deployments -n school-fees-manager
kubectl get pods -n school-fees-manager
kubectl get svc -n school-fees-manager

# Get external IP (wait for <pending> to resolve)
kubectl get svc school-fees-manager-external -n school-fees-manager

# Test the service
curl http://<EXTERNAL-IP>/students

# Update image (triggers rolling update)
kubectl set image deployment/school-fees-manager-rolling \
  school-fees-manager=emerthe/school-fees-manager:1.0.1 \
  -n school-fees-manager

# Monitor rollout
kubectl rollout status deployment/school-fees-manager-rolling -n school-fees-manager

# Rollback if needed
kubectl rollout undo deployment/school-fees-manager-rolling -n school-fees-manager
```

### Manual Deployment (Blue-Green)

```bash
# Deploy blue-green strategy
kubectl apply -f k8s/base/namespace.yml
kubectl apply -f k8s/strategies/blue-green.yml

# Check both deployments
kubectl get deployments -n school-fees-manager

# Update GREEN (new version for testing)
kubectl set image deployment/school-fees-manager-green \
  school-fees-manager=emerthe/school-fees-manager:1.0.1 \
  -n school-fees-manager

# Run smoke tests on GREEN
kubectl run test --image=curlimages/curl --rm -it \
  -n school-fees-manager \
  -- curl http://school-fees-manager-blue-green/students

# If tests pass, switch to GREEN
kubectl patch svc school-fees-manager-blue-green \
  -p '{"spec":{"selector":{"slot":"green"}}}' \
  -n school-fees-manager

# Verify GREEN is live
kubectl get endpoints school-fees-manager-blue-green -n school-fees-manager

# Rollback to BLUE (if issues)
kubectl patch svc school-fees-manager-blue-green \
  -p '{"spec":{"selector":{"slot":"blue"}}}' \
  -n school-fees-manager
```

### Automated Deployment (GitHub Actions)

1. **Add kubeconfig to GitHub Secrets:**
   ```bash
   # Encode kubeconfig
   cat ~/.kube/config | base64 -w0
   # Paste into GitHub Settings → Secrets → KUBE_CONFIG
   ```

2. **Push a version tag:**
   ```bash
   git tag -a v1.0.2 -m "Release v1.0.2"
   git push origin v1.0.2
   ```

3. **Monitor deployment:**
   - GitHub Actions: https://github.com/Emerthe/school-_fees_managment/actions
   - Kubernetes: `kubectl get deployments -n school-fees-manager`
   - Slack notification sent on completion

## Monitoring Deployments

### Check deployment status
```bash
kubectl describe deployment school-fees-manager-rolling -n school-fees-manager
kubectl get events -n school-fees-manager --sort-by='.lastTimestamp'
```

### Check pod logs
```bash
kubectl logs deployment/school-fees-manager-rolling -n school-fees-manager -f
kubectl logs <pod-name> -n school-fees-manager -c school-fees-manager
```

### Check resource usage
```bash
kubectl top pods -n school-fees-manager
kubectl top nodes
```

### Check HPA status
```bash
kubectl get hpa -n school-fees-manager
kubectl describe hpa sfm-hpa -n school-fees-manager
```

## Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n school-fees-manager
# Check: ImagePullBackOff, CrashLoopBackOff, Pending
```

**Liveness probe failing:**
```bash
# Check if /students endpoint is accessible
kubectl exec <pod-name> -n school-fees-manager -- curl localhost:3000/students
```

**Service has no endpoints:**
```bash
kubectl get endpoints school-fees-manager -n school-fees-manager
# If empty, check readiness probes and pod status
```

**HPA not scaling:**
```bash
# Check metrics server is installed
kubectl get deployment metrics-server -n kube-system

# Check HPA events
kubectl describe hpa sfm-hpa -n school-fees-manager
```

## Files Summary

| File | Purpose |
|---|---|
| `k8s/base/namespace.yml` | Namespace, ConfigMap, Secret, Services, HPA |
| `k8s/strategies/rolling-update.yml` | Rolling update deployment + PDB |
| `k8s/strategies/blue-green.yml` | Blue-green deployment strategy |
| `.github/workflows/deploy.yml` | GitHub Actions CD pipeline |

## Next Steps

1. Set up Kubernetes cluster (local minikube, EKS, GKE, DigitalOcean, etc.)
2. Create `school-fees-manager` namespace and secrets
3. Deploy rolling-update strategy: `kubectl apply -f k8s/base/namespace.yml && kubectl apply -f k8s/strategies/rolling-update.yml`
4. Verify deployment: `kubectl get pods -n school-fees-manager`
5. Configure GitHub Secrets: `KUBE_CONFIG` and `SLACK_SECRET`
6. Push a version tag to trigger automated CD: `git tag v1.0.0 && git push origin v1.0.0`
7. Monitor deployment on Actions tab and in cluster

## References

- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [PodDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
