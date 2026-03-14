# Production Checklist

<!-- AI_CONTEXT
This document provides a pre-deployment checklist.
Key commands: ./dev.sh build:prod, ./dev.sh up:prod, ./dev.sh status:prod (colons not hyphens)
Key commands: ./dev.sh test, ./dev.sh lint, ./dev.sh typecheck
DATABASE_URL is NOT required — individual DB_* params are used with defaults. DATABASE_URL is only needed for external managed databases.
SESSION_SECRET IS required in production (no default in production mode).
dev-login endpoint has no environment guard — must be removed or gated before deploying.
Rollback: docker compose with both compose files, or tag previous images.
Related docs: docker, environment-variables, security/*
-->

Work through this before your first production deploy, and again when you make significant changes. Each item is something that's either a security risk, a common source of production failures, or something you'll wish you'd thought about before it breaks at 2am.

---

## Code Quality

- [ ] **Tests pass** — `./dev.sh test` completes with no failures
- [ ] **Build succeeds** — `./dev.sh build:prod` completes without errors
- [ ] **No TypeScript errors** — `./dev.sh typecheck` shows no issues
- [ ] **No lint errors** — `./dev.sh lint` is clean

If any of these fail in development, they'll fail in production. Don't skip them.

---

## Security

### The dev-login endpoint

- [ ] **Remove or gate `POST /api/auth/dev-login`** — This endpoint creates an admin account and logs in with no password. It has no environment check in the current code, so it's accessible in production as-is. Either delete it from `index.ts` or wrap it with `if (env.NODE_ENV !== 'production') { ... }` before deploying.

This is the highest-risk item on this list. An exposed dev-login endpoint means anyone can create an admin account on your production app.

### Session Security

- [ ] **`SESSION_SECRET` is set** — Must be a long random string. Generate one:
  ```bash
  openssl rand -hex 32
  ```
- [ ] **`SESSION_SECRET` is unique to production** — Don't reuse the dev default or a staging secret
- [ ] **Cookie security** — With `NODE_ENV=production`, cookies are automatically set to `secure: true` (HTTPS only). Verify your server has HTTPS.

### CORS

- [ ] **`WEB_URL` points to your production domain** — `https://app.example.com`, not `http://localhost:3001`
- [ ] **`CORS_ORIGINS` contains only trusted domains** — Remove any staging/dev URLs that shouldn't have API access in production

### Secrets Management

- [ ] **No secrets in code or git** — All credentials via environment variables
- [ ] **Different credentials per environment** — Production database has a different password than development
- [ ] **`.env` files not committed** — Check `.gitignore` includes `.env`

---

## Environment Configuration

- [ ] **`NODE_ENV=production`** — This changes cookie security, logging format, synchronize behavior, and error messages. Must be set.
- [ ] **`SESSION_SECRET`** — Required. No default in production.
- [ ] **Database credentials** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) — Change from the weak development defaults (`app_user` / `app_pass`) to strong production credentials.
- [ ] **`WEB_URL`** — Set to your production frontend URL for CORS.

> **Note on DATABASE_URL:** You don't need to set this separately. The API uses individual `DB_*` params. `DATABASE_URL` is only needed if you're using an external managed database service (Supabase, Neon, Railway, etc.) that provides a connection string.

---

## Docker & Infrastructure

- [ ] **Production images built** — `./dev.sh build:prod` completed successfully
- [ ] **No source code mounts** — `volumes: []` in `docker-compose.prod.yml` ensures production runs compiled code, not your development files
- [ ] **Database port not exposed** — The production compose removes the external port mapping; verify the database isn't reachable from outside your server
- [ ] **Restart policy set** — `restart: unless-stopped` means containers recover from crashes automatically
- [ ] **Health checks passing** — `./dev.sh status:prod` shows all services as `(healthy)`

---

## Database

- [ ] **`synchronize: false` in production** — TypeORM's `synchronize` is only enabled when `NODE_ENV === 'development'`. In production, schema changes go through migrations. Verify `NODE_ENV=production` is set.
- [ ] **Migrations run** — If you've added new entities or columns, run migrations before deploying the new code
- [ ] **Backups configured** — Set up automated backups. At minimum, daily pg_dump to a separate storage location.
- [ ] **Database credentials are strong** — Default credentials (`app_user` / `app_pass`) are for development only

---

## Verification

### Before deploying

```bash
# Run everything locally in production mode first
./dev.sh build:prod
export SESSION_SECRET=$(openssl rand -hex 32)
./dev.sh up:prod
./dev.sh status:prod

# Hit the health endpoints
curl http://localhost:4001/healthz    # should return {"status":"ok"}
curl http://localhost:4001/readyz     # should return {"status":"ok","database":"connected"}
```

### After deploying

- [ ] **`/healthz` responds** — `curl https://api.example.com/healthz` returns `{"status":"ok"}`
- [ ] **`/readyz` responds** — Database connectivity confirmed
- [ ] **Login flow works** — Register an account, log in, log out
- [ ] **Session management works** — Login shows under active sessions, revoke works
- [ ] **Password reset flow works** — Forgot password email sends (check your email config)
- [ ] **API docs accessible** — `https://api.example.com/api-docs` loads (if you want this public)

---

## Networking & HTTPS

- [ ] **SSL certificate installed** — HTTPS required for `secure` cookies to work
- [ ] **DNS configured** — Domain pointing to your server
- [ ] **HTTP → HTTPS redirect** — Users going to `http://` get redirected
- [ ] **Firewall** — Only ports 80, 443 (and 22 for SSH) open externally

---

## Monitoring

These aren't launch blockers but become important fast once you have real users:

- [ ] **Log aggregation** — Ship your container logs somewhere you can search them (Datadog, Logtail, CloudWatch, etc.)
- [ ] **Uptime monitoring** — An external service pinging `/healthz` and alerting you when it stops responding (UptimeRobot, Better Uptime, etc.)
- [ ] **Error alerting** — Some way to know when unexpected 500 errors are happening

---

## Rollback Plan

Know how to roll back before you need to. If the new deploy breaks something:

```bash
# Stop the broken deployment
./dev.sh down:prod

# Rebuild from the last known good commit
git checkout <previous-commit>
./dev.sh build:prod
./dev.sh up:prod
```

Or if you tag your Docker images before each deploy, you can switch image tags without rebuilding.

---

## Next Steps

- **[Docker Deployment](/dashboard/docs/deployment/docker)** — Production image details and commands
- **[Environment Variables](/dashboard/docs/deployment/environment-variables)** — Complete variable reference
