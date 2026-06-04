---
name: redaction-devis
description: Phase 5 du pipeline Besoin→Devis — rédaction du devis (livrable type MT).
phase_backend: redaction_devis
---

# Devis — Phase 5 : rédaction du devis

Pipeline allégé **Besoin→Devis** (mode simple). Les instructions et livrables
attendus sont fournis par le serveur (source de vérité).

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `redaction_devis`, avertis l'user (cette
   commande s'applique à cette phase).
3. Sinon, `tendergraph_step(action="continue")` pour récupérer instructions +
   contexte + livrables attendus + validators.
4. Lis le dossier EN LOCAL (Read/Glob, pas d'upload), produis le(s) livrable(s)
   selon les instructions du serveur.
5. `tendergraph_step(action="submit", deliverable_path=..., content=...)`. Si
   `violations`, corrige et re-soumets jusqu'à succès.
6. Préfixe ta réponse de la ligne `provenance` (`[TITAN]`) si présente. Résume :
   livrables produits, phase suivante.
