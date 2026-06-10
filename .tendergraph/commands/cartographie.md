---
name: cartographie
description: Cartographie les livrables attendus par le DCE (dossier-map)
phase_backend: cartographie
---

# Phase 2 — cartographie livrables

Produit 00-dossier-map.md avec priorité P0/P1/P2/P3 et graphe de dépendances

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `cartographie`, avertis l'user :
   *"Le pipeline est actuellement en phase X, cette commande s'applique à cartographie.
   Voulez-vous forcer un saut ? (non recommandé)"*.
3. Dès que l'identité du marché est connue (acheteur, référence/numéro de consultation,
   objet, montant, lots), appelle `tendergraph_register_dossier(project_id, acheteur,
   reference, objet, montant, lots)` — **1 projet = 1 marché**. Si la réponse vaut
   `different_market`, relaie l'avertissement à l'user (proposer de créer un projet dédié) ;
   deux lots d'un même marché ne déclenchent pas d'alerte.
4. Sinon, appelle `tendergraph_step(action="continue")` pour récupérer les
   instructions + contexte + livrables attendus + validators.
4. Produis le(s) livrable(s) selon les instructions fournies par le serveur.
5. Pour chaque livrable, `tendergraph_step(action="submit", deliverable_path=..., content=...)`.
6. Si `violations`, corrige et re-soumets jusqu'à succès.
7. Retourne un résumé textuel : livrables produits, temps écoulé, phase suivante.

Ne triche pas avec les validators. Si le brief demande un marquage [FD]/[FP]/[H],
respecte-le. Si le CRT impose un plan, respecte-le.
