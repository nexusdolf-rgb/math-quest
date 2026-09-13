# 📘 Guide débutant : GitHub → Netlify (en images dans les mots)

Deux parties : **A)** mettre le jeu sur GitHub, **B)** le publier avec Netlify.
Compte 10-15 minutes la première fois, sans aucune ligne de commande.

---

# Partie A — Créer le dépôt GitHub et y mettre les fichiers

### A1. Préparer les fichiers
1. Télécharge **`math-quest.zip`** sur ton PC.
2. Clic droit sur le fichier → **Extraire tout** (Windows) ou **Ouvrir avec Archive** (Mac).
3. Tu obtiens un dossier **`math-quest`** contenant :
   - `index.html`, `manifest.json`, `sw.js`, `netlify.toml`, `README.md`…
   - et **3 dossiers** : `css`, `js`, `icons`
   → Ces dossiers et fichiers doivent TOUS partir ensemble sur GitHub.

### A2. Créer le dépôt (vide)
4. Connecte-toi sur **https://github.com**
5. Clique sur le **+** en haut à droite → **New repository**
6. Remplis :
   - **Repository name** : `math-quest`
   - Choisis **Public**
   - ⚠️ **NE COCHE PAS** « Add a README file », ni `.gitignore`, ni license
     (le dépôt doit rester vide, sinon GitHub refusera l'envoi par glisser-déposer)
7. Clique sur le bouton vert **Create repository**

### A3. Envoyer les fichiers par glisser-déposer
8. Sur la page « Quick setup », clique sur le lien bleu
   **« uploading an existing file »**.
9. Ouvre ton dossier **`math-quest`** extrait en A1.
10. Sélectionne **TOUT son contenu** d'un coup :
    - Windows : clique dans le dossier puis `Ctrl + A`
    - Mac : `Cmd + A`
    (tu dois avoir surlignés les fichiers **et** les dossiers `css`, `js`, `icons`)
11. **Glisse l'ensemble** dans la grande zone pointillée de la page GitHub.
12. Attends que tout apparaisse dans la liste :
    `index.html`, `css/styles.css`, `css/print.css`,
    `js/util.js`, `js/audio.js`, `js/fx.js`, `js/data.js`, `js/profile.js`,
    `js/questions.js`, `js/engine-quiz.js`, `js/games.js`, `js/screens.js`, `js/app.js`,
    `icons/…`, `manifest.json`, `sw.js`, `netlify.toml`…
13. En bas, dans « Commit changes », clique sur le bouton vert
    **Commit changes** et attends la fin du traitement.

✅ C'est fait : ton code est sur GitHub à l'adresse
`https://github.com/TON-PSEUDO/math-quest`

> 💡 Navigateur recommandé : **Chrome ou Edge** sur ordinateur (ils gèrent bien
> l'envoi de dossiers par glisser-déposer).

---

# Partie B — Publier le jeu avec Netlify connecté à GitHub

### B1. Connecter Netlify à ton GitHub
14. Va sur **https://app.netlify.com** et crée un compte gratuit
    (bouton **Sign up with GitHub** conseillé — sinon email)
15. Clique sur **Add new site** → **Import an existing project**
16. Choisis la vignette **Deploy with GitHub**
17. Une fenêtre GitHub demande d'autoriser Netlify → clique
    **Authorize Netlify** (c'est la seule autorisation, et elle est révocable
    à tout moment dans les réglages GitHub)
18. Si demandé, choisis **Only select repositories** et sélectionne **`math-quest`**,
    puis **Install / Authorize**

### B2. Déployer
19. De retour sur Netlify, clique sur le dépôt **`math-quest`**
20. Sur l'écran de réglages, **ne touche à rien** (c'est un site statique) :
    - Base directory : vide
    - Build command : vide
    - Publish directory : vide
21. Clique sur le bouton vert **Deploy math-quest**
22. Attends 30-60 secondes (barre de progression) → le site passe **Published** 🎉
23. Clique sur le lien généré (ex. `https://random-name-123.netlify.app`) :
    **ton jeu est en ligne !**

### B3. Choisir une jolie adresse
24. Dans Netlify : **Site configuration** → **Change site name**
25. Tape par exemple `math-quest-ecole`
    → ton adresse devient **https://math-quest-ecole.netlify.app**

---

# 🔄 Plus tard, mettre à jour le jeu (magique)

Quand tu modifies des fichiers sur GitHub, **Netlify se met à jour tout seul en 30 s** :

- **Pour modifier un seul fichier** : ouvre-le sur GitHub, clique sur l'icône ✏️
  crayon en haut à droite, modifie, puis **Commit changes** → redéploiement auto.
- **Pour remplacer plusieurs fichiers** : dans le dépôt, **Add file → Upload files**,
  glisse les nouveaux fichiers (en gardant les mêmes dossiers), **Commit changes**.
- Tu verras chaque mise en ligne dans l'onglet **Deploys** de Netlify.

---

# 📱 Installer le jeu comme une application
Une fois en ligne, ouvre l'adresse sur un téléphone puis :
- **Android/Chrome** : menu ⋮ → « Ajouter à l'écran d'accueil »
- **iPhone/Safari** : bouton Partager → « Sur l'écran d'accueil »

Après la première visite, le jeu marche **sans connexion Internet**. 🎮

---

# 🔐 Bonnes pratiques sécurité
- Ne donne **jamais** ton mot de passe ni un *token* GitHub à quelqu'un ou un chat.
- L'autorisation Netlify se gère dans GitHub : Settings → Applications → Netlify.
- Tu peux supprimer le site dans Netlify ou le dépôt dans GitHub à tout moment.
