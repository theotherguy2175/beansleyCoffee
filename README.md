# BeansleyCoffee

A home coffee-ordering app. Customers browse a menu, place an order (with a
pickup time, size, strength, syrup, and notes), and get an email receipt. The
person making the coffee gets notified by email, and can mark orders ready —
which emails the customer too. Staff manage the menu; admins manage
everything (users, settings, SMTP).

## Stack

- **Client**: Vite + React + TypeScript, [shadcn/ui](https://ui.shadcn.com)
  (Radix primitives + Tailwind CSS), react-router, react-query,
  react-hook-form + zod.
- **Server**: Express + TypeScript, [Drizzle ORM](https://orm.drizzle.team)
  over SQLite (`better-sqlite3`), session auth (`express-session`), Nodemailer.
- **Deploy**: single Docker image (Express serves the built client too),
  docker-compose for local testing, Kubernetes manifests for production.

## Local development

```bash
npm install
cp .env.example server/.env   # or export the same vars in your shell
npm run dev                   # server on :4001, client on :5173 (proxies /api)
```

On first boot the server auto-creates a bootstrap admin (from
`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`) and, if the menu is
empty, seeds it with 11 coffees (photos + descriptions committed in
`server/seed/`) plus starter coffee types, syrups, and sizes. Both are
idempotent — they only run when the relevant table is empty, so they're safe
on every boot.

Useful scripts (run from the repo root):

| Command | What it does |
|---|---|
| `npm run dev` | Server + client dev servers concurrently |
| `npm run build` | Production build of both workspaces |
| `npm run typecheck` | Typecheck both workspaces |
| `npm run db:generate` | Generate a Drizzle migration after a schema change |

## Running with Docker

```bash
cp .env.example .env   # fill in real values — this file is gitignored
docker compose up -d --build
```

The app comes up at `http://localhost:3000`. Data persists in
`.docker-data/` (bind-mounted, gitignored) across restarts.

**Note on SMTP/admin env vars**: `SMTP_USER`, `SMTP_PASS`, and
`MAKER_NOTIFICATION_EMAIL` are optional — the app boots fine without them and
can be configured later from the admin Settings page (stored in the DB,
which takes precedence). `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`
only take effect the **first** time the container starts against an empty
database — they create the admin account once and are never consulted again
as long as an admin already exists. Changing them later and restarting does
nothing to an existing account; see the "Resetting the bootstrap admin"
section in `CLAUDE.md` if you need to actually rotate it.

## Deploying to Kubernetes

Manifests live in `k8s/`. Copy `k8s/secret.example.yaml` to `k8s/secret.yaml`,
fill in real values, and apply it out-of-band (never commit it):

```bash
docker build -t <your-registry>/beansleycoffee:latest .
docker push <your-registry>/beansleycoffee:latest
# update the image in k8s/deployment.yaml, then:
kubectl apply -f k8s/pvc.yaml -f k8s/configmap.yaml -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml -f k8s/ingress.yaml
```

The deployment runs a single replica (`strategy: Recreate`) since SQLite is
single-writer and the PVC is `ReadWriteOnce`. `k8s/ingress.yaml` assumes a
TLS-terminating ingress (e.g. ingress-nginx + cert-manager) is already set up
in the cluster — adjust the `ingressClassName` / annotations to match.

## Roles

- **customer** — browse the menu, place orders, view/cancel their own orders.
- **staff** — everything a customer can do, plus manage coffees and menu
  options (types, syrups, sizes).
- **admin** — everything staff can do, plus manage users and system settings
  (maker notification email, SMTP credentials).

## Repo layout

```
server/          Express + TypeScript API
  src/db/        Drizzle schema + generated migrations
  src/routes/    Express routers, one per resource
  src/services/  Business logic + DB queries
  src/lib/       Boot-time helpers (migrations, bootstrap admin, menu seed)
  seed/          Committed seed images + seed data (baked into the Docker image)
client/          Vite + React + TypeScript app
  src/routes/    Page components, grouped by portal (public/customer/staff/admin)
  src/components/ui/      shadcn/ui primitives
  src/components/shared/  App-specific shared components
  src/hooks/     react-query hooks per resource
k8s/             Kubernetes manifests
Dockerfile       Multi-stage build → single runtime image
```

See `CLAUDE.md` for architectural notes, gotchas, and design rationale aimed
at whoever (human or AI) picks this codebase up next.
