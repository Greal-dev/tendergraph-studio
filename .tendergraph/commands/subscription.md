---
name: subscription
description: Affiche l'état de la souscription TITAN — statut, slots payés, projets actifs/en pause, lien portail Stripe.
---

Appelle le tool `my_subscription` (sans arguments). Présente à l'user, en
commençant par la ligne `provenance` (`[TITAN]`) :

- `status` (abonnement) et `quantity` (slots payés) ;
- `n_active` / `n_paused` projets ;
- `policy` (elastic / strict / none) ;
- `portal_url` (lien de gestion Stripe) s'il est présent.

Lecture seule. Ne crée ni ne modifie rien.
