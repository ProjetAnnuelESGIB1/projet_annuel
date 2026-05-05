## HTML

### Critère 1 — Structure sémantique

> Utilisez-vous les bonnes balises HTML selon le contenu ? (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`…)
> Oui

### Critère 2 — Pas de style inline

> Avez-vous évité d'écrire du CSS directement dans les attributs `style="..."` de vos balises HTML ?
> Oui mais uniquement pour changer un paramètre d'une classe CSS au cas par cas (uniquement pour le fichier index.html)

### Critère 3 — Pas de duplication de structure

> Avez-vous des blocs HTML quasi-identiques copiés-collés plusieurs fois ? (ex : cartes, lignes de tableau, formulaires similaires)
> Oui, pour l'historique et pour pour le formulaire d'ajout d'une dépense (index.html). Pour la vue des données "Reste à vivre", "Dépenses totales", "Revenus" dans insight.html.

### Critère 4 — Attributs `alt` sur les images

> Toutes vos balises `<img>` ont-elles un attribut `alt` qui décrit l'image ?
> Pas de balises `<img>` de présentent sur les deux fichiers HTML.

### Critère 5 - Titres

> Chaque page ne contient-elle qu'un seul titre principal `<h1>` ? Les niveaux de titres sont-ils respectés (h1 → h2 → h3…) ?
> Pas de doublon pour la balise `<h1>`

### Critère 6 — Formulaires bien structurés

> Vos formulaires utilisent-ils des `<label>` associés à chaque `<input>` via l'attribut `for` ?
> Oui

### Critère 7 - Utilisation de balise obselète

> Utilisez-vous encore des balises obsolètes comme `<center>`, `<font>`, ou `<b>` à la place de `<strong>` ?
> Non

### Critère 8 — Indentation cohérente

> Votre HTML est-il bien indenté ? Peut-on lire la hiérarchie des balises d'un coup d'œil ?
> Oui, la hiérarchie est bien visible

### Critère 9 — Pas de `<div>` inutiles

> Avez-vous des `<div>` vides ou imbriquées sans raison qui pourraient être remplacées par une balise sémantique ?
> Tous les `<div>` ont un id ou participe au CSS.

### Critère 10 — Fichiers liés correctement

> Vos fichiers CSS et JS sont-ils liés dans le bon ordre ? (`<link>` CSS dans le `<head>`, `<script>` JS avant `</body>`)
> Oui

## CCS

### Critère 1 — Pas de règles en double

> Avez-vous des propriétés CSS répétées plusieurs fois pour le même effet ? Avez-vous pensé à créer des classes réutilisables ?
>Non, nos proprietés ne se répete pas pour les meme effet et Oui nous avons creee des classes reutilisables


### Critère 2 — Organisation du fichier CSS

> Votre CSS est-il organisé de façon logique ? (global → composants → pages) — et êtes-vous en mesure de retrouver rapidement une règle ?
>oui completement.


### Critère 3 — Variables CSS

> Utilisez-vous des variables CSS (`--couleur-primaire`, `--font-titre`…) pour vos couleurs et polices récurrentes ?
>oui effectivement.


### Critère 4 — Pas de valeurs magiques

> Avez-vous des valeurs numériques arbitraires dans votre CSS (`margin: 37px`, `top: 13px`…) sans que l'on comprenne pourquoi ce chiffre précis ?
>oui nous en avons.


### Critère 5 — Responsive / Media queries

> Votre site s'affiche-t-il correctement sur mobile ? Avez-vous utilisé des media queries pour adapter la mise en page ?
>Non nous n'avons pas adapter pour mobile encore et oui les media queries ont été utiliser pour la mise en page.(a voir)


### Critère 6 — Nommage des classes

> Vos classes CSS ont-elles des noms qui décrivent leur rôle ? (`.card`, `.btn-primary`) plutôt que (`.rouge`, `.div2`) ?
>oui completement


### Critère 7 — Pas d'abus de `!important`

> Avez-vous utilisé `!important` pour forcer des styles ? C'est souvent le signe d'un conflit de spécificité à résoudre proprement.
>pas du tout utiliser.


### Critère 8 — Utilisation de Flexbox ou Grid

> Utilisez-vous `flex` ou `grid` pour vos mises en page plutôt que des `float` ou `position: absolute` un peu partout ?
> oui amplement


### Critère 9 — Cohérence visuelle

> Vos espacements, tailles de police et couleurs sont-ils cohérents sur l'ensemble du site ? Ou chaque page a-t-elle ses propres valeurs "au feeling" ?
>oui nos espacements, tailles de police et couleurs sont cohérents sur l'ensemble du site (pour chaque page)


### Critère 10 — Commentaires de section dans le CSS

> Avez-vous ajouté des commentaires pour délimiter les grandes sections de votre fichier CSS ?
>Oui en effet.

## JavaScript

### Critère 1 — Réutilisation des fonctions

> Avez-vous écrit des blocs de code JS très similaires à plusieurs endroits ? Si oui, pouvez-vous les regrouper dans une fonction commune ?
> Non, chacuns des blocs fais quelque chose de spécifiques.

### Critère 2 — Organisation du code JS

> Votre JavaScript est-il dans un seul gros bloc ? Avez-vous pensé à regrouper les fonctions par thème, ou à utiliser des commentaires pour s'y retrouver ?
> Oui, plusieurs thèmes sont présent pour retrouver des fonctions.

### Critère 3 — Pas de `console.log` oubliés

> Avez-vous pensé à supprimer (ou commenter) vos `console.log` de debug avant de livrer ?
> Oui nous les avons supprimé

### Critère 4 — `const` et `let` plutôt que `var`

> Utilisez-vous `const` pour les valeurs fixes et `let` pour celles qui évoluent ? Avez-vous encore des `var` dans votre code ?
>Aucun `var` n'est présent dans le code, seulement des `const` et des `let`.

### Critère 5 — Cache des sélections DOM

> Stockez-vous vos sélections `querySelector` dans des variables pour ne les faire qu'une fois, plutôt que de les répéter à chaque appel ?
>Sur les 4, un `querySelector` est dans une variable et 3 autres sont répéter a chaque fois qu'on les appelles car on ne peut pas faire autrement étant donné qu'ils ont une incidence sur des éléments dynamiques.

### Critère 6 — Gestion des événements propre

> Utilisez-vous `addEventListener` ? Ou avez-vous encore des `onclick="..."` directement dans votre HTML ?
>Nous utilisons des `addEventListener` activement.

### Critère 7 — Pas de code JS dans les fichiers HTML

> Votre JavaScript est-il dans un fichier `.js` séparé ? Ou avez-vous de gros blocs `<script>` directement dans vos pages HTML ?
> Les JavaScript sont dans des fichiers `.js` séparé.

### Critère 8 — Nommage clair des fonctions et variables

> Vos fonctions JS décrivent-elles clairement leur action ? (`afficherMenu()`, `calculerTotal()`) plutôt que (`f1()`, `truc()`) ?
> Oui ,les fonctions ont un nom qui décrivent clairement leurs actions. 

### Critère 9 — Gestion basique des erreurs sur les `fetch`

> Lorsque vous faites une requête `fetch`, gérez-vous les cas d'erreur (réseau KO, réponse non-OK) ?
>Sur le seul `fetch` présent oui nous gérons le cas d'erreur.

### Critère 10 — Commentaires sur le code complexe

> Avez-vous commenté les parties de votre JS qui ne sont pas immédiatement compréhensibles ? Un collègue pourrait-il reprendre votre code sans vous poser de questions ?
>Non, il est trés compliqué de reprendre le code une semaine plus tard ou anciennement écrit par un collégue.
