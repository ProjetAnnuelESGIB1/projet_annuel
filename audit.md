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

> Chaque page ne contient-elle qu'un seul titre principal <h1> ? Les niveaux de titres sont-ils respectés (h1 → h2 → h3…) ?
> Pas de doublon pour la balise `<h1>`

### Critère 6 — Formulaires bien structurés

> Vos formulaires utilisent-ils des `<label>` associés à chaque `<input>` via l'attribut `for` ?
> Oui

### Critère 7 - Utilisation de balise obselète

> Utilisez-vous encore des balises obsolètes comme `<center>`, `<font>`, ou `<b>` à la place de `<strong>` ?
> Non,

### Critère 8 — Indentation cohérente

> Votre HTML est-il bien indenté ? Peut-on lire la hiérarchie des balises d'un coup d'œil ?
> Oui, la hiérarchie est bien visible

### Critère 9 — Pas de `<div>` inutiles

> Avez-vous des `<div>` vides ou imbriquées sans raison qui pourraient être remplacées par une balise sémantique ?
> Tous les `<div>` ont un id ou participe au CSS.

### Critère 10 — Fichiers liés correctement

> Vos fichiers CSS et JS sont-ils liés dans le bon ordre ? (`<link>` CSS dans le `<head>`, `<script>` JS avant `</body>`)
> Oui



