---
name: strategie-solution
description: Phase 3 du pipeline Besoin→Devis — stratégie de solution.
phase_backend: strategie_solution
---

# Devis — Phase 3 : stratégie de solution

Pipeline allégé **Besoin→Devis** (mode simple). Les instructions et livrables
attendus sont fournis par le serveur (source de vérité).

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `strategie_solution`, avertis l'user (cette
   commande s'applique à cette phase).
3. Sinon, `tendergraph_step(action="continue")` pour récupérer instructions +
   contexte + livrables attendus + validators.
4. Lis le dossier EN LOCAL (Read/Glob, pas d'upload), produis le(s) livrable(s)
   selon les instructions du serveur.
5. `tendergraph_step(action="submit", deliverable_path=..., content=...)`. Si
   `violations`, corrige et re-soumets jusqu'à succès.
6. Préfixe ta réponse de la ligne `provenance` (`[TITAN]`) si présente. Résume :
   livrables produits, phase suivante.
