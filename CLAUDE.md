# CLAUDE.md — TenderGraph Studio

Instructions projet-specifiques pour tout agent Claude intervenant sur ce
repository. A combiner avec ~/.claude/CLAUDE.md (doctrine globale).

---

## Contexte

Ce repo est un fork d'OpenCode (https://github.com/sst/opencode, MIT) brande
**TenderGraph Studio**. Il distribue un agent IA pre-configure pour le pipeline
TenderGraph de reponse aux appels d'offres publics.

**Architecture overlay** : tout le code OpenCode upstream reste intact.
Les personnalisations TG vivent dans :

```
.tendergraph/       # agents, commands, hooks, config
tools/              # scripts de verification alignement
TENDERGRAPH.md      # doc d'architecture et positionnement
```

---

## REGLE #1 — Rester alignable upstream

**Ne pas modifier** les fichiers OpenCode upstream sauf en cas de necessite
absolue (branding minimal : `package.json`, `README.md`, theme). Tout le reste
vit dans `.tendergraph/` en overlay.

Avant toute modif dans `packages/`, poser la question :
*Est-ce que je peux faire la meme chose via un agent, un hook, ou une slash
command dans .tendergraph/ ?* Si oui, prefere cette voie.

Rebase upstream mensuel via :

```bash
git fetch upstream && git rebase upstream/dev
```

---

## REGLE #2 — Alignement avec backend tendergraph-v3

Ce repo consomme le backend https://tendergraph-v3.fly.dev via MCP. L'endpoint
`/api/mcp/catalog` est la source de verite des phases, tools et validators.

**Toute modification de `.tendergraph/commands/*.md` ou `.tendergraph/agents/*.md`
doit passer `bun run tools/check-tg-alignment.ts`** (CI bloque sinon).

Voir `.tendergraph/docs/ALIGNMENT.md` pour le contrat detaille.

---

## REGLE #3 — IP doctrinale reste cote backend

Ne **jamais** copier dans ce repo le contenu des prompts riches
`backend/prompts/phase_*.md`, les regles detaillees des validators, les
grilles de classification, les seuils numeriques, ou la doctrine Shipley CVD.

Ces elements restent exclusivement cote `tendergraph-v3` (serveur MCP) et
sont servis via `resources/read` aux clients connectes avec un seat actif.

Ce qui est OK dans Studio :

- Roles courts d'agents (ex : "tu es rédacteur expert de mémoires techniques")
- Checklists operationnelles (ex : "marques `[FD]`/`[FP]`/`[H]` attendus")
- Slash commands minces qui delegent au serveur via `tendergraph_step`

Ce qui N'EST PAS OK :

- Les prompts complets de phase (phase_03_strategie.md, etc.)
- Les regles numeriques des validators (seuils, ratios, tolerances)
- Les patterns anti-forcage en detail
- Les grilles de scoring internes

---

## REGLE #4 — Multi-provider avec badge qualite

Studio supporte 6+ providers LLM (Anthropic, OpenAI, Google, xAI, Moonshot,
Zhipu, custom OpenAI-compatible). Qualite tres variable selon modele.

Tout ajout de provider doit :

1. Figurer dans `.tendergraph/config/tendergraph.config.json` avec
   `qualityBadge: "green" | "yellow" | "red"`.
2. Avoir ete teste sur un dossier de reference TG (check CI separe).
3. Documenter dans `.tendergraph/docs/PROVIDERS.md` (a creer si absent) les
   limitations connues (ex : "tool-use parallele non supporte", "contexte
   max 32k tokens").

---

## Workflow

Pour toute modif non-triviale :

1. Lire `TENDERGRAPH.md` + `.tendergraph/docs/ARCHITECTURE.md` + `ALIGNMENT.md`
2. Verifier si la modif touche l'overlay (OK) ou l'upstream (poser la question)
3. Modifier, tester localement `bun run tools/check-tg-alignment.ts`
4. Commit + PR. La CI GitHub Actions verifie alignment + structure.

---

## Avant merge d'une PR

- [ ] `bun run tools/check-tg-alignment.ts` passe
- [ ] Structure overlay valide (fichiers presents, shebangs hooks OK)
- [ ] Pas d'IP doctrinale introduite dans ce repo
- [ ] Si modif `.tendergraph/config/` : backward-compatible ou bump major
- [ ] Upstream merge state `MERGEABLE` (pas de conflit gros)

## Ressources

- Upstream OpenCode : https://github.com/sst/opencode
- Backend TenderGraph : https://github.com/Greal-dev/tendergraph-v3
- Catalog API : https://tendergraph-v3.fly.dev/api/mcp/catalog
- Guide user : https://tendergraph-v3.fly.dev/api/mcp/docs/human
- Guide agent : https://tendergraph-v3.fly.dev/api/mcp/docs/agent
