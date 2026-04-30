# Titan Installer Worker (Cloudflare)

Worker servant `titan.tendergraph.app/install.ps1` (et la page d'accueil `/`).

## Architecture

- `titan.tendergraph.app/` → HTML branding + commande d'install
- `titan.tendergraph.app/install.ps1` → proxy live vers `raw.githubusercontent.com/Greal-dev/tendergraph-studio/dev/install.ps1` (cache 5 min via Cloudflare edge)
- `titan.tendergraph.app/healthz` → 200 OK pour uptime monitoring

## Pre-requis

1. **Domaine `tendergraph.app` chez Cloudflare** : DNS gere par Cloudflare (pas seulement registrar). Si ce n'est pas le cas, transferer les NS vers Cloudflare avant.
2. **Compte Cloudflare avec Workers active** : free tier suffit (100k requetes/jour, on en fera <100/jour).

## Deploiement (dashboard Cloudflare)

### Etape 1 — Creer le Worker

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Create Worker**.
2. Nom : `titan-installer` (ou autre).
3. **Deploy** (le code par defaut sera remplace).
4. Cliquer **Edit code** → coller le contenu de `titan-installer.js` → **Save and deploy**.

### Etape 2 — Bind du domaine custom

1. Dans le Worker `titan-installer` → onglet **Settings** → **Domains & Routes**.
2. **Add Custom Domain** → `titan.tendergraph.app`.
3. Cloudflare cree automatiquement le DNS record CNAME et le certificat TLS.

Verifier : `curl -I https://titan.tendergraph.app/healthz` doit renvoyer `200 OK`.

## Deploiement (CLI wrangler — alternative)

```bash
npm install -g wrangler
wrangler login
cd infra/cloudflare-worker
wrangler deploy titan-installer.js --name titan-installer --route "titan.tendergraph.app/*"
```

Necessite un `wrangler.toml` ; pour la simplicite, prefere le dashboard.

## Mise a jour du code Worker

Dashboard : Workers & Pages → `titan-installer` → **Edit code** → coller la nouvelle version → Save and deploy.

Ou via wrangler : `wrangler deploy titan-installer.js --name titan-installer`.

## Mise a jour du `install.ps1` lui-meme

Aucune action sur le Worker. Push sur la branche `dev` du repo → cache invalide automatiquement apres 5 min, ou via dashboard CF (Caching → Purge Cache).

## Observabilite

- Workers Analytics : invocations / erreurs / geo dans le dashboard.
- Logs en live : `wrangler tail titan-installer`.

## Rollback

Workers garde l'historique des deployments (dashboard → **Deployments**). Cliquer un deployment anterieur → **Promote**.
