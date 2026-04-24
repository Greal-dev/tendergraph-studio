# Release et distribution — TenderGraph Studio

## État actuel

**V0.1.0-alpha** : overlay TG livré, alignement CI actif. Pas encore
d'installateurs natifs signés. Distribution via fork git + build local :

```bash
git clone https://github.com/Greal-dev/tendergraph-studio
cd tendergraph-studio
bun install
bun run dev              # lance le CLI en mode dev
```

## V0.2.0 — cible

- **npm package `@tendergraph/studio`** : wrapper qui installe les
  dépendances OpenCode + copie `.tendergraph/` overlay dans le home du user.
- **Brew tap** `greal-dev/tap` avec formula `tendergraph-studio`.
- **Scoop bucket** pour Windows.
- **AppImage** Linux via `tauri-action` ou équivalent.

## V1.0.0 — installateurs signés

- **macOS** : DMG notarized (Apple Developer ID, certificat + notarisation
  API Apple). Côté code : `electron-builder` ou `@tauri-apps/cli` selon
  quelle couche OpenCode on utilise.
- **Windows** : MSI signé (Authenticode EV cert, recommandé pour éviter
  SmartScreen). Auto-update via Squirrel ou WinGet.
- **Linux** : AppImage + .deb + Snap. GPG sign.

## Cadence upstream

Rebase `upstream/dev` **mensuel** minimum. Script :

```bash
git fetch upstream
git rebase upstream/dev
# Résoudre conflits éventuels (rarement dans .tendergraph/ si overlay propre)
git push --force-with-lease origin dev
```

Si un rebase casse quelque chose, créer une PR dédiée avec tag
`upstream-sync`.

## Sécurité

- Les binaires signés sont publiés uniquement via tags GitHub Releases
  (jamais en commit direct).
- Les clés de signature vivent en secrets GitHub Actions (nom suggéré :
  `APPLE_DEVELOPER_ID`, `APPLE_NOTARIZE_PASSWORD`, `WINDOWS_CODE_SIGN_CERT`).
- La CI release n'a accès aux secrets que via l'environnement
  `release-production` avec approbation manuelle (protection rule).

## Release notes

Chaque release pousse un markdown généré depuis les PRs mergées entre
le tag précédent et le tag courant, formatté en sections :
- 🚀 New features
- 🐛 Bug fixes
- 🔧 Alignment updates (si catalog backend évolue)
- 📝 Docs

Lien vers le backend correspondant (`tendergraph-v3` release) pour permettre
aux admins de verrouiller des couples testés ensemble.

## Support multi-versions

Studio v(n) doit rester compatible avec backend v(≥ n). Concrètement :

- Un changement "breaking" côté backend passe par la *grace period* décrite
  dans `ALIGNMENT.md` (2 releases Studio pour absorber).
- Pour les déploiements air-gapped (clients on-prem backend), on tag le
  dernier studio connu-compatible dans le changelog backend.
