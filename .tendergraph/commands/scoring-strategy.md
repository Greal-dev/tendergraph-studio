---
name: scoring-strategy
description: Stratégie de scoring (grille de notation, formule financière, courbes)
phase_backend: scoring_strategy
---

# Phase — scoring_strategy

Construit la stratégie de scoring : extraction de la grille de notation du RC,
analyse de la formule financière, simulation des courbes note(ratio),
pondération composite. S'appuie sur `extract_scoring`, `simulate_price_curve`,
`simulate_composite_weighting`, `validate_scoring_strategy`.

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `scoring_strategy`, avertis l'user :
   *"Le pipeline est actuellement en phase X, cette commande s'applique à scoring_strategy.
   Voulez-vous forcer un saut ? (non recommandé)"*.
3. Sinon, appelle `tendergraph_step(action="continue")` pour récupérer les
   instructions + contexte + livrables attendus + validators.
4. Produis le(s) livrable(s) selon les instructions fournies par le serveur.
5. Pour chaque livrable, `tendergraph_step(action="submit", deliverable_path=..., content=...)`.
6. Si `violations` (notamment `validate_scoring_strategy`), corrige et re-soumets jusqu'à succès.
7. Retourne un résumé textuel : livrables produits, temps écoulé, phase suivante.

Ne triche pas avec les validators. Si le brief demande un marquage [FD]/[FP]/[H],
respecte-le. Si le CRT impose un plan, respecte-le.
