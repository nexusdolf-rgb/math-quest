/* ============================================================
   MATH QUEST v2 — app.js
   Routeur, démarrage, actions et installation hors-ligne (PWA)
   ============================================================ */
'use strict';

const MODES_QUIZ = ['divisions', 'vrai-faux', 'manquant', 'comparaison', 'fractions',
  'suite', 'compte', 'dizaines', 'horloge', 'monnaie', 'formes',
  'suite-pro', 'equations'];
const ECRANS_JEUX_SPECIAUX = {
  devinette: ecranDevinette, ordre: ecranOrdre, memory: ecranMemory,
  coloriage: ecranColoriage, fusee: ecranFusee, taupe: ecranTaupe,
  pingpong: ecranPingPong, sudoku: ecranSudoku
};

function aller(ecran) {
  toutArreter();
  JEU = {};
  fermerModale();
  const ecrans = {
    accueil: ecranAccueil,
    aventure: ecranAventure,
    jeux: ecranJeux,
    niveaux: ecranNiveaux,
    tables: ecranTables,
    boutique: ecranBoutique,
    defis: ecranDefis,
    classement: ecranClassement,
    profil: ecranProfil,
    reglages: ecranReglages,
    diplome: ecranDiplome
  };
  (ecrans[ecran] || ecranAccueil)();
}

function ouvrirMode(mode) {
  if (mode === 'calcul') return aller('niveaux');
  if (mode === 'tables') return aller('tables');
  if (mode === 'duel') return ecranDuel(2);
  if (mode === 'party') { nbJoueursFete = 3; return rendreDuel(); }
  if (ECRANS_JEUX_SPECIAUX[mode]) return ECRANS_JEUX_SPECIAUX[mode]();
  return lancerQuizMode(mode);
}
function refaireDernier() {
  const der = JEU.dernier;
  if (!der) return aller('accueil');
  if (der.type === 'niveau') return lancerNiveau(der.id);
  if (der.type === 'table') return lancerTable(der.n);
  if (der.type === 'defi') return lancerDefiJour();
  if (der.type === 'boss') return lancerBoss();
  if (der.type === 'boss-aventure') return lancerBossAventure(der.boss, JEU.aventureId);
  if (der.type === 'fete') return relancerFete();
  if (der.type === 'mode') {
    if (ECRANS_JEUX_SPECIAUX[der.mode]) return ECRANS_JEUX_SPECIAUX[der.mode]();
    return lancerQuizMode(der.mode);
  }
  aller('accueil');
}

/* ---------- Événements ---------- */
document.addEventListener('click', e => {
  AudioMX.deverrouiller();
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const d = el.dataset, act = d.act;
  sfx('clic');

  switch (act) {
    /* Bienvenue */
    case 'choisir-avatar': tempAvatar = d.avatar; ecranBienvenue(); break;
    case 'choisir-age': tempAge = parseInt(d.age, 10); ecranBienvenue(); break;
    case 'creer-compte': {
      const input = $('#pseudo-input');
      const pseudo = input.value.trim();
      if (pseudo.length < 2) { dire('✏️ Écris ton pseudo (2 lettres minimum) !'); input.focus(); return; }
      creerJoueur(pseudo, tempAge, tempAvatar);
      const r = connexionQuotidienne();
      appliquerTheme();
      pluieConfettis(100);
      ecranAccueil();
      dire(`Bienvenue ${pseudo} ! 🎉`);
      if (r) apres(() => modaleRecompenseJour(r), 1200);
      break;
    }

    /* Navigation */
    case 'nav': aller(d.ecran); break;
    case 'son':
      AudioMX.basculerGlobal();
      ecranAccueil();
      break;
    case 'reglage-effets':
      AudioMX.setEffets(!AudioMX.prefs.effets);
      ecranReglages();
      break;
    case 'reglage-voix':
      AudioMX.setVoix(!AudioMX.prefs.voix);
      ecranReglages();
      break;
    case 'reglage-musique':
      AudioMX.setMusique(!AudioMX.prefs.musique);
      ecranReglages();
      break;
    case 'reglage-tout':
      AudioMX.basculerGlobal();
      ecranReglages();
      break;

    /* Défis */
    case 'defi-jour': lancerDefiJour(); break;
    case 'lancer-boss': lancerBoss(); break;

    /* Jeux */
    case 'ouvrir-mode': ouvrirMode(d.mode); break;
    case 'lancer-noeud': lancerNoeud(d.id); break;
    case 'lancer-niveau': lancerNiveau(parseInt(d.id, 10)); break;
    case 'lancer-table': lancerTable(parseInt(d.n, 10)); break;
    case 'niv-verrouille': dire('🔒 Termine le niveau précédent pour débloquer celui-ci !'); break;
    case 'repondre': traiterReponse(parseInt(d.i, 10)); break;
    case 'quiz-pause': pauseQuiz(); break;
    case 'quiz-reprendre': reprendreQuiz(); break;
    case 'refaire': refaireDernier(); break;

    /* Devinette */
    case 'dev-chiffre': devineAjout(d.n); break;
    case 'dev-efface': { const dd = JEU.devinette; if (dd) { dd.saisie = dd.saisie.slice(0, -1); rendreDevinette(); } break; }
    case 'dev-valide': devineValide(); break;

    /* Ordre / Memory */
    case 'ordre-touche': ordreTouche(parseInt(d.i, 10)); break;
    case 'memory-touche': memoryTouche(parseInt(d.i, 10)); break;

    /* Coloriage */
    case 'color-modele': coloriageActif = parseInt(d.i, 10); rendreColoriage(); break;
    case 'color-couleur': peintureChoisie = d.c; rendreColoriage(); break;
    case 'color-efface': peintureChoisie = 'GOMME'; rendreColoriage(); break;
    case 'color-cell': peintCellule(d.cle); break;
    case 'color-reset':
      if (confirm('Effacer tout le coloriage ?')) {
        Object.keys(cellulesPeintes).forEach(k => { if (k.startsWith(coloriageActif + '-')) delete cellulesPeintes[k]; });
        rendreColoriage();
      }
      break;

    /* Arcade */
    case 'fusee-rep': fuseeRepond(parseInt(d.i, 10)); break;
    case 'taupe-tap': taupeTape(parseInt(d.i, 10)); break;
    case 'ping-rep': pingRepond(parseInt(d.i, 10)); break;

    /* Sudoku */
    case 'sud-cell': sudChoisit(parseInt(d.k, 10)); break;
    case 'sud-chiffre': sudChiffre(parseInt(d.n, 10)); break;
    case 'sud-efface': sudEfface(); break;

    /* Multijoueur */
    case 'fete-nb': nbJoueursFete = parseInt(d.n, 10); rendreDuel(); break;
    case 'fete-diff': JEU.feteDiff = d.d; marqueDiff(); break;
    case 'fete-commencer': commencerFete(); break;
    case 'fete-pret': jouerTourFete(); break;

    /* Boutique */
    case 'boutique-onglet': boutiqueOnglet = d.o; ecranBoutique(); break;
    case 'equiper-theme': equiperTheme(d.id); sfx('piece'); ecranBoutique(); break;
    case 'acheter-theme': {
      const theme = THEMES.find(t => t.id === d.id);
      if (joueur.pieces < theme.prix) { dire('🪙 Pas assez de pièces ! Joue pour en gagner.'); return; }
      acheterTheme(theme); appliquerTheme();
      dire(`${theme.emoji} Thème « ${theme.nom} » acheté et activé !`);
      ecranBoutique();
      break;
    }
    case 'acheter-accessoire': {
      const acc = ACCESSOIRES.find(a => a.id === d.id);
      const acheteAvant = joueur.accessoiresAchetes.includes(acc.id);
      if (!acheteAvant && joueur.pieces < acc.prix) { dire('🪙 Pas assez de pièces ! Joue pour en gagner.'); return; }
      acheterAccessoire(acc);
      dire(acheteAvant ? `${acc.emoji} accessoire équipé !` : `${acc.emoji} Accessoire acheté !`);
      ecranBoutique();
      break;
    }

    /* Profil */
    case 'profil-avatar': joueur.avatar = d.avatar; sauverJoueur(); ecranProfil(); break;
    case 'profil-accessoire': {
      const id = d.id || null;
      if (id && !joueur.accessoiresAchetes.includes(id)) { dire('🔒 Cet accessoire est à acheter dans la boutique !'); return; }
      joueur.accessoire = id; sauverJoueur(); ecranProfil();
      break;
    }
    case 'profil-reset':
      if (confirm('Effacer ce joueur et tout recommencer ? (pseudo, étoiles, pièces, badges…)')) {
        reinitialiser();
        tempAvatar = '🦊'; tempAge = 7;
        appliquerTheme();
        ecranBienvenue();
      }
      break;
    case 'imprimer': window.print(); break;
  }
});

/* ---------- Récompense de connexion ---------- */
function modaleRecompenseJour(r) {
  modale(`
    <div class="m-emoji">🎁</div>
    <h3>Récompense du jour !</h3>
    <p>${r.serie === 1 ? 'Content de te voir !' : `Série de ${r.serie} jour${r.serie > 1 ? 's' : ''} ! Tu es au top !`}</p>
    <div class="m-recomp">+${r.pieces} 🪙 pièces</div>
    <button class="btn btn-grand btn-orange" data-act="ferme-modale">Youpi ! 🎉</button>`);
  sfx('jour');
  setTimeout(() => AudioMX.voix('accueil', true), 300);
}

/* Retire le badge "Powered by Netlify" injecté sur les sites hébergés */
function retirerBadgeNetlify() {
  const retire = () => document
    .querySelectorAll('#nl-badge-frame, iframe[title="Powered by Netlify"]')
    .forEach(e => e.remove());
  retire();
  if (document.body) new MutationObserver(retire).observe(document.body, { childList: true });
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="ferme-modale"]')) fermerModale();
});

/* ---------- Service worker (mode hors-ligne / installation) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* API de débogage exposée sur window (sert aussi aux tests automatiques) */
window.MQ = {
  get joueur() { return joueur; },
  get JEU() { return JEU; },
  aller, ouvrirMode, lancerNiveau, lancerQuizMode, lancerBoss, lancerDefiJour,
  lancerNoeud, ecranPingPong, ecranSudoku,
  ecranTaupe, ecranFusee, ecranBoutique, ecranAccueil, ecranAventure, ecranDiplome
};

/* ---------- Démarrage ---------- */
function demarrage() {
  migrer();
  retirerBadgeNetlify();
  const splash = $('#splash');
  setTimeout(() => splash.classList.add('hors'), 900);
  setTimeout(() => splash.remove(), 1600);

  if (!joueur) {
    ecranBienvenue();
    return;
  }
  appliquerTheme();
  missionsJour();
  compteurJour();
  const r = connexionQuotidienne();
  ecranAccueil();
  if (r) apres(() => modaleRecompenseJour(r), 1100);
}
demarrage();
