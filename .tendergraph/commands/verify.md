---
name: verify
description: Verifie la provenance TITAN d'un livrable (signature de provenance HMAC). Usage - /verify <path>. Retourne authentic / modified / not_titan / unsigned.
---

Args attendus :

- `path` : chemin du livrable (ex: `7-proposition/memoire-technique.md`, ou un `.pptx` / `.xlsx` / `.docx` / `.pdf`)

Appelle `verify_deliverable(project_id, path)`.

Etats retournes :

- `authentic` : signature HMAC TITAN valide sur le contenu courant (produit/verifie par TITAN, non modifie depuis).
- `modified` : signe par TITAN mais altere depuis (le contenu ne correspond plus a la signature) -> ce livrable n'engage plus TITAN.
- `not_titan` : aucune signature TITAN (jamais produit/signe par TITAN).
- `unsigned` : des versions existent mais aucune n'est signee.

Texte (md/txt) : verifie via les versions signees du livrable. Office/pdf
(pptx/xlsx/docx/pdf) : verifie via la signature embarquee dans les metadonnees
du fichier (invisible au rendu).

Utile pour confirmer qu'un livrable remis porte bien la provenance TITAN, ou
pour detecter qu'un fichier a ete edite hors TITAN. Ne modifie rien.
