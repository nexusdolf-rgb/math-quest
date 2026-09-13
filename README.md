# 🧮 Math Quest v2 — Le jeu de maths des enfants de 5 à 12 ans

Un jeu éducatif **gratuit, sans publicité, sans serveur, sans abonnement et jouable hors-ligne**.
Il fonctionne sur ordinateur, tablette et téléphone, et peut même **s'installer comme une application**
(bouton « Ajouter à l'écran d'accueil »).

> Recréé et enrichi à partir d'un jeu Base44 d'origine, sans dépendre d'aucun service payant.

---

## ▶️ Jouer tout de suite sur ton ordinateur

Double-clique sur **`index.html`** : le jeu fonctionne, même sans connexion après la première visite.

---

## 🌍 Mettre le jeu EN LIGNE gratuitement

### ⭐ Solution recommandée — Netlify Drop (5 minutes, aucune technique)

1. Va sur **https://app.netlify.com/drop** (crée un compte gratuit avec ton email ou Google).
2. Prends **tout le dossier `math-quest`** (celui qui contient `index.html` **et** les
   sous-dossiers `css`, `js`, `icons`).
3. **Glisse-dépose ce dossier entier** sur la page Netlify.
4. Au bout de 30 secondes, ton jeu est en ligne, par exemple
   `https://math-quest-123.netlify.app` 🎉
5. Pour choisir le nom : **Site configuration → Change site name**,
   ex. `math-quest-ecole` → adresse `https://math-quest-ecole.netlify.app`.
6. Pour mettre à jour plus tard : onglet **Deploys**, re-glisse le dossier (l'adresse reste la même).

> 💾 Tu peux aussi utiliser le fichier **`math-quest.zip`** fourni : décompresse-le,
> puis glisse le dossier obtenu (Netlify demande un dossier, pas le zip directement).

### Alternative — GitHub Pages (10 minutes)

1. Crée un compte gratuit sur **https://github.com**, puis **New repository** nommé `math-quest` (Public).
2. Clique sur **uploading an existing file** et glisse **tous les fichiers et dossiers**, puis **Commit changes**.
3. **Settings → Pages**, sous **Branch** choisis `main` et `/ (root)`, puis **Save**.
4. Après 1-2 minutes : `https://TON-PSEUDO.github.io/math-quest/`.

> 🔐 **Sécurité : ne communique JAMAIS ton mot de passe GitHub ni un token/une clé SSH.**
> Tout se fait à la main sur le site officiel, aucune clé n'est nécessaire.

---

## 🎮 Contenu (21 jeux)

**Calcul mental** — 15 niveaux progressifs débloqués en chemin (additions, soustractions,
tables de 2 à 10, divisions, nombres jusqu'à 100, défi final boss).

**Entraînement ciblé**
- ✖️ Tables de multiplication (2 à 10)
- ➗ **Divisions — NOUVEAU**
- ⚖️ **Comparaison de nombres et de calculs — NOUVEAU**
- ❓ Nombre manquant
- ✅ Vrai ou Faux
- 🧱 **Dizaines et unités (barres de 10 et cubes) — NOUVEAU**

**Éveil et logique**
- 🎯 Devinette du nombre mystère
- 📊 Ordre croissant des nombres
- 🃏 Memory Math (opération ↔ résultat)
- 🍕 Fractions (parts de pizza)
- 🔢 Suites logiques
- 🔷 **Formes géométriques (10 formes + nombre de côtés) — NOUVEAU**
- ⏰ **Lecture de l'heure sur une pendule — NOUVEAU**
- 🪙 **Monnaie : pièces et billets en euros — NOUVEAU**

**Arcade et amusement**
- 🔨 **Tape-Taupe des opérations (30 s) — NOUVEAU**
- 🚀 Fusée (60 s chrono)
- 🍒 Compte rapide
- 🎨 Coloriage magique (5 dessins)

**À plusieurs**
- ⚔️ Duel à 2 · 🎉 Multijoueur de 2 à 4 sur le même écran, avec podium

## 🏆 Système de motivation

- 🪙 **Pièces** gagnées en jouant et en enchaînant les **combos** (séries)
- ⭐ De 1 à 3 étoiles par niveau
- 🏅 **16 badges** à collectionner
- 🎯 **3 missions quotidiennes** renouvelées chaque jour
- 📅 **Récompense de connexion** avec série de 7 jours
- 👑 **Boss des Maths** quotidien (15 épreuves mélangées, +60 pièces)
- 🛍️ **Boutique** : 7 thèmes d'ambiance (Espace 🪐, Océan 🌊, Forêt 🌳…) et
  7 accessoires d'avatar (couronne 👑, chapeau 🧢…)
- 🏆 Classement local avec podium
- 🚀 Records (Fusée, Tape-Taupe, Memory)
- 🎓 **Diplôme de Grand Champion imprimable / exportable en PDF**
- 🔊 13 effets sonores différents **+ musique de fond originale** (réglables dans les ⚙️ Réglages)
- 🦊 Mascotte qui donne des conseils de calcul

## 📱 Installer comme une application

- **Téléphone (Chrome/Android, Safari/iOS)** : ouvre le site → menu du navigateur →
  **« Ajouter à l'écran d'accueil »**. L'icône Math Quest apparaît et le jeu s'ouvre en plein écran.
- Grâce au mode hors-ligne, une fois visité, le jeu reste disponible sans connexion.

---

## 🗂️ Structure du projet (code organisé « façon pro »)

```
math-quest/
├─ index.html          ← page unique
├─ manifest.json       ← installation PWA
├─ sw.js               ← mise en cache pour le hors-ligne
├─ css/
│  ├─ styles.css       ← design (couleurs, cartes, animations)
│  └─ print.css        ← mise en page de l'impression du diplôme
├─ js/
│  ├─ util.js          ← outils (hasard, stockage, minuteurs…)
│  ├─ audio.js         ← sons et musique (générés, aucun fichier audio)
│  ├─ fx.js            ← confettis, particules, modales
│  ├─ data.js          ← niveaux, jeux, badges, boutique, coloriages
│  ├─ profile.js       ← sauvegarde, XP, pièces, missions, badges
│  ├─ questions.js     ← générateurs de questions de chaque jeu
│  ├─ engine-quiz.js   ← moteur de questions/ réponses réutilisable
│  ├─ games.js         ← jeux spéciaux (Tape-Taupe, Memory, Fusée, Duel…)
│  ├─ screens.js       ← tous les écrans
│  └─ app.js           ← démarrage et routage des clics
└─ icons/              ← icônes d'application
```

## 🛠️ Personnaliser (sans rien installer)

Ouvre le fichier voulu avec un éditeur gratuit comme **VS Code** ou le Bloc-notes :
- **Niveaux / valeurs** : `js/data.js` (tableau `NIVEAUX`).
- **Avatars** : ligne `const AVATARS = [...]` dans `js/data.js`.
- **Nouveaux coloriages** : tableau `COLORIAGES` dans `js/data.js`.
- **Couleurs principales** : tout en haut de `css/styles.css` (section `:root`).
- Après chaque modif, enregistre et rafraîchis la page (F5).
  En ligne, redépose le dossier sur Netlify.

## 🔒 Confidentialité

Aucune donnée n'est envoyée sur internet : la progression (pseudo, étoiles, pièces, badges)
reste **uniquement dans le navigateur de l'appareil**, via `localStorage`. Idéal pour un usage
à l'école ou en famille. Aucun compte, aucune publicité, aucun tracker.

Bon jeu et bons calculs ! 🚀
