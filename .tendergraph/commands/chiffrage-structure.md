---
name: chiffrage-structure
description: Phase 4 du pipeline Besoin→Devis — structuration du chiffrage (ossature charges/lots, taux fournis par l'humain).
phase_backend: chiffrage_structure
---

# Devis — Phase 4 : structuration du chiffrage

Pipeline allégé **Besoin→Devis** (mode simple). Le chiffrage est une
**structuration** (ossature charges/lots/options), pas une génération de
montants : les taux/barème viennent de l'humain. Instructions et livrables
fournis par le serveur (source de vérité).

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `chiffrage_structure`, avertis l'user (cette
   commande s'applique à cette phase).
3. Sinon, `tendergraph_step(action="continue")` pour récupérer instructions +
   contexte + livrables attendus + validators.
4. Lis le dossier EN LOCAL (Read/Glob, pas d'upload), produis le(s) livrable(s)
   selon les instructions du serveur. Tout montant doit être marqué `[H]`/`[P]`
   tant qu'il n'est pas sourcé par l'humain.
5. `tendergraph_step(action="submit", deliverable_path=..., content=...)`. Si
   `violations` (ex. montant non sourcé), corrige et re-soumets.
6. Préfixe ta réponse de la ligne `provenance` (`[TITAN]`) si présente. Résume :
   livrables produits, phase suivante.
