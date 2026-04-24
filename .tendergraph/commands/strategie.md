---
name: strategie
description: Construit JTBD externe, value prop interne, proposition consolidée, positionnement Shipley
phase_backend: strategie
---

# Phase 3 — stratégie

Produit 01a/01b/01c + 02-positionnement.md. Invoque positioning-critic après pour QA.

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `strategie`, avertis l'user :
   *"Le pipeline est actuellement en phase X, cette commande s'applique à strategie.
   Voulez-vous forcer un saut ? (non recommandé)"*.
3. Sinon, appelle `tendergraph_step(action="continue")` pour récupérer les
   instructions + contexte + livrables attendus + validators.
4. Produis le(s) livrable(s) selon les instructions fournies par le serveur.
5. Pour chaque livrable, `tendergraph_step(action="submit", deliverable_path=..., content=...)`.
6. Si `violations`, corrige et re-soumets jusqu'à succès.
7. Retourne un résumé textuel : livrables produits, temps écoulé, phase suivante.

Ne triche pas avec les validators. Si le brief demande un marquage [FD]/[FP]/[H],
respecte-le. Si le CRT impose un plan, respecte-le.
