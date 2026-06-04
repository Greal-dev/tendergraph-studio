---
name: revue-materialisation
description: Phase 6 du pipeline Besoin→Devis — revue et matérialisation du kit de livrables.
phase_backend: revue_materialisation
---

# Devis — Phase 6 : revue & matérialisation

Pipeline allégé **Besoin→Devis** (mode simple). Phase finale : revue de
cohérence + matérialisation du kit de livrables. Instructions et livrables
fournis par le serveur (source de vérité).

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `revue_materialisation`, avertis l'user (cette
   commande s'applique à cette phase).
3. Sinon, `tendergraph_step(action="continue")` pour récupérer instructions +
   contexte + livrables attendus + validators.
4. Produis/finalise le(s) livrable(s) selon les instructions du serveur.
5. `tendergraph_step(action="submit", deliverable_path=..., content=...)`. Si
   `violations`, corrige et re-soumets jusqu'à succès.
6. Préfixe ta réponse de la ligne `provenance` (`[TITAN]`) si présente. Résume :
   kit de livrables produit, statut final.
