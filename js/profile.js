/* ============================================================
   MATH QUEST v2 — profile.js
   Profil du joueur, progression, pièces, missions du jour,
   série de connexion, badges, boutique et records
   ============================================================ */
'use strict';

let joueur = stockage.get('mq_joueur_v2', null);

function profilVide() {
  return {
    version: 2,
    pseudo: '', age: 7, avatar: '🦊', accessoire: null,
    xp: 0, pieces: 0,
    etoiles: {},
    badges: [],
    coloriages: [],
    theme: 'classique',
    themesAchetes: ['classique'],
    accessoiresAchetes: [],
    jeuxJoues: [],
    records: {},
    serieJours: 0, dernierJour: null,
    missions: null,              // { date, list:[ids], fait:[ids] }
    jour: null,                  // compteurs du jour
    aventure: { noeuds: {}, coffres: [] }, // v3.0 : carte des mondes
    stats: {
      parties: 0, justes: 0, total: 0, serieMax: 0,
      ops: { add: 0, sub: 0, mul: 0, div: 0, autre: 0 }
    }
  };
}

/* Migration des sauvegardes v1 (Math Quest première version) */
function migrer() {
  const ancien = stockage.get('mq_joueur', null);
  if (!joueur && ancien) {
    const base = profilVide();
    joueur = {
      ...base,
      pseudo: ancien.pseudo || 'Joueur',
      age: ancien.age || 7,
      avatar: ancien.avatar || '🦊',
      xp: ancien.xp || 0,
      pieces: Math.round((ancien.xp || 0) / 5),
      etoiles: ancien.etoiles || {},
      badges: ancien.badges || [],
      coloriages: ancien.coloriages || [],
      jeuxJoues: [],
      stats: {
        ...base.stats,
        parties: ancien.stats?.parties || 0,
        justes: ancien.stats?.justes || 0,
        total: ancien.stats?.total || 0,
        serieMax: ancien.stats?.serieMax || 0
      }
    };
    sauverJoueur();
  }
  if (joueur) {
    // Complète les champs qui pourraient manquer après une mise à jour
    const base = profilVide();
    let modifie = false;
    for (const [cle, val] of Object.entries(base)) {
      if (!(cle in joueur)) { joueur[cle] = Array.isArray(val) || typeof val === 'object' && val !== null ? JSON.parse(JSON.stringify(val)) : val; modifie = true; }
    }
    if (!joueur.stats.ops) { joueur.stats.ops = base.stats.ops; modifie = true; }
    if (modifie) sauverJoueur();
  }
}

function creerJoueur(pseudo, age, avatar) {
  joueur = profilVide();
  joueur.pseudo = pseudo;
  joueur.age = age;
  joueur.avatar = avatar;
  sauverJoueur();
}
function sauverJoueur() { stockage.set('mq_joueur_v2', joueur); }

function titreActuel() {
  let t = TITRES[0][1], seuilSuivant = TITRES[1][0];
  for (let i = 0; i < TITRES.length; i++) {
    if (joueur.xp >= TITRES[i][0]) {
      t = TITRES[i][1];
      seuilSuivant = TITRES[i + 1] ? TITRES[i + 1][0] : null;
    }
  }
  return { titre: t, seuilSuivant };
}
const totalEtoiles = () => Object.values(joueur.etoiles).reduce((a, b) => a + b, 0);
const niveauxFinis = () => NIVEAUX.filter(n => (joueur.etoiles[n.id] || 0) > 0).length;

/* ---------- Pièces ---------- */
function ajouterPieces(n) { joueur.pieces += n; }
function ajouterXP(n) { joueur.xp += n; }

/* ---------- Missions du jour (sélectionnées par la date) ---------- */
function missionsJour() {
  const jour = aujourdhui();
  if (!joueur.missions || joueur.missions.date !== jour) {
    const rng = graineChaine('missions-' + jour);
    const list = melangeGraine(MISSIONS_JOUR.map(m => m.id), rng).slice(0, 3);
    joueur.missions = { date: jour, list, fait: [] };
    sauverJoueur();
  }
  return joueur.missions;
}
function compteurJour() {
  const jour = aujourdhui();
  if (!joueur.jour || joueur.jour.date !== jour) {
    joueur.jour = { date: jour, correct: 0, jeux: [], parties: 0, parfait: 0, etoiles: 0 };
    sauverJoueur();
  }
  return joueur.jour;
}
/* Progression d'une mission */
function progressionMission(cle) {
  const j = compteurJour();
  if (cle === 'jeux') return j.jeux.length;
  return j[cle] || 0;
}
/* Enregistre une action pour les missions ; retourne les missions qui se terminent */
function enregistrerAction(action, valeur = 1, mode = null) {
  const j = compteurJour();
  if (action === 'correct') j.correct += valeur;
  if (action === 'parties') j.parties += valeur;
  if (action === 'parfait') j.parfait += valeur;
  if (action === 'etoiles') j.etoiles += valeur;
  if (action === 'jeux' && mode && !j.jeux.includes(mode)) j.jeux.push(mode);
  const m = missionsJour();
  const nouvelles = [];
  m.list.forEach(id => {
    if (m.fait.includes(id)) return;
    const def = MISSIONS_JOUR.find(x => x.id === id);
    if (progressionMission(def.cle) >= def.objectif) {
      m.fait.push(id);
      ajouterPieces(def.recomp.pieces);
      ajouterXP(def.recomp.xp);
      nouvelles.push(id);
    }
  });
  sauverJoueur();
  return nouvelles;
}

/* ---------- Récompense de connexion quotidienne ---------- */
function connexionQuotidienne() {
  const jour = aujourdhui();
  if (joueur.dernierJour === jour) return null;
  let serie;
  if (joueur.dernierJour === hierStr()) serie = (joueur.serieJours || 0) + 1;
  else serie = 1;
  const pieces = RECOMPENSES_SERIE[(serie - 1) % RECOMPENSES_SERIE.length];
  joueur.serieJours = serie;
  joueur.dernierJour = jour;
  ajouterPieces(pieces);
  sauverJoueur();
  return { serie, pieces };
}

/* ---------- Badges ---------- */
function verifierBadges() {
  const a = id => !joueur.badges.includes(id);
  const finis = niveauxFinis();
  const parfait = NIVEAUX.some(n => (joueur.etoiles[n.id] || 0) === 3);
  const nouveaux = [];
  const donne = (cond, id) => { if (cond && a(id)) { joueur.badges.push(id); nouveaux.push(id); } };
  donne(finis >= 1, 'first_star');
  donne(parfait, 'perfect');
  donne(joueur.stats.serieMax >= 5, 'streak_5');
  donne(finis >= 7, 'half_done');
  donne(finis >= NIVEAUX.length, 'champion');
  donne(totalEtoiles() >= 30, 'star_master');
  donne(joueur.xp >= 100, 'xp_100');
  donne(joueur.xp >= 500, 'xp_500');
  donne(joueur.xp >= 1000, 'xp_1000');
  donne(joueur.stats.justes >= 100, 'justes_100');
  donne(joueur.jeuxJoues.length >= 5, 'explorateur');
  donne((joueur.records.memory || 99) <= 9, 'memory_pro');
  donne((joueur.records.fusee || 0) >= 15, 'pilote');
  donne((joueur.records.taupe || 0) >= 20, 'taupe_pro');
  donne(joueur.pieces >= 200, 'tirelire');
  donne(joueur.serieJours >= 3, 'assidu');
  // v3.0 : badges Aventure (les helpers sont définis dans aventure.js)
  if (joueur.aventure) {
    donne(mondeFini(0), 'aventurier');
    donne(['mb1', 'eb2', 'ib3'].every(id => (joueur.aventure.noeuds[id] || 0) > 0), 'boss3');
    donne(tousCoffresPris(), 'tresors');
    donne(aventureFinie(), 'grand_explorateur');
  }
  donne((joueur.records.pingpong || 0) >= 15, 'ping_pro');
  if (nouveaux.length) sfx('debloque');
  sauverJoueur();
  return nouveaux;
}

/* ---------- Boutique ---------- */
function acheterTheme(theme) {
  if (joueur.themesAchetes.includes(theme.id)) { joueur.theme = theme.id; sauverJoueur(); appliquerTheme(); return true; }
  if (joueur.pieces < theme.prix) return false;
  joueur.pieces -= theme.prix;
  joueur.themesAchetes.push(theme.id);
  joueur.theme = theme.id;
  sauverJoueur();
  sfx('achat');
  appliquerTheme();
  verifierBadges();
  return true;
}
function equiperTheme(id) { joueur.theme = id; sauverJoueur(); appliquerTheme(); }
function acheterAccessoire(acc) {
  if (!joueur.accessoiresAchetes.includes(acc.id)) {
    if (joueur.pieces < acc.prix) return false;
    joueur.pieces -= acc.prix;
    joueur.accessoiresAchetes.push(acc.id);
    sfx('achat');
  }
  joueur.accessoire = joueur.accessoire === acc.id ? null : acc.id;
  sauverJoueur();
  verifierBadges();
  return true;
}
function accessoireEmoji(id) {
  const a = ACCESSOIRES.find(x => x.id === id);
  return a ? a.emoji : '';
}
function appliquerTheme() { document.body.dataset.theme = joueur ? joueur.theme : 'classique'; }

/* ---------- Records ---------- */
function batRecord(cle, valeur, plusHaut = true) {
  const ancien = joueur.records[cle];
  const bat = ancien === undefined || (plusHaut ? valeur > ancien : valeur < ancien);
  if (bat) { joueur.records[cle] = valeur; sauverJoueur(); return true; }
  return false;
}

/* ---------- Session de jeu terminée : calcul des récompenses ---------- */
/* opts: { mode, niveauId, justes, total, serie, etoiles, parfait, opStats:{add,...}, recordCle, recordValeur, bonusPieces } */
function finSession(opts) {
  const parfait = opts.parfait !== undefined ? opts.parfait : opts.justes === opts.total;
  // v3.1 : les pièces se gagnent un peu plus durement (1 par bonne réponse,
  // petit bonus de qualité), ce qui donne de la valeur à la boutique.
  let pieces = opts.justes;
  if (parfait && opts.justes > 1) pieces += 8;
  if (opts.etoiles) pieces += opts.etoiles * 3;
  if (opts.bonusPieces) pieces += opts.bonusPieces;
  let xp = opts.justes * 10 + (parfait && opts.justes > 1 ? 20 : 0);
  if (opts.etoiles) xp += opts.etoiles * 10;
  if (opts.bonusXP) xp += opts.bonusXP;

  joueur.stats.parties++;
  joueur.stats.justes += opts.justes;
  joueur.stats.total += opts.total;
  joueur.stats.serieMax = Math.max(joueur.stats.serieMax, opts.serie || 0);
  if (opts.opStats) {
    for (const [op, n] of Object.entries(opts.opStats)) {
      const cle = ['add', 'sub', 'mul', 'div'].includes(op) ? op : 'autre';
      joueur.stats.ops[cle] += n;
    }
  }
  if (opts.mode && !joueur.jeuxJoues.includes(opts.mode) && opts.mode !== 'calcul') {
    joueur.jeuxJoues.push(opts.mode);
  }
  if (opts.niveauId !== undefined && opts.etoiles !== null && opts.etoiles !== undefined) {
    const ancienE = joueur.etoiles[opts.niveauId] || 0;
    joueur.etoiles[opts.niveauId] = Math.max(ancienE, opts.etoiles);
  }
  // v3.0 : progression de la carte Aventure
  const aventureId = opts.aventureId !== undefined ? opts.aventureId : (JEU.aventureId || null);
  if (aventureId && opts.etoiles !== null && opts.etoiles !== undefined && joueur.aventure) {
    const ancien = joueur.aventure.noeuds[aventureId] || 0;
    joueur.aventure.noeuds[aventureId] = Math.max(ancien, opts.etoiles);
  }
  ajouterPieces(pieces);
  ajouterXP(xp);

  // Records
  let recordBattu = false;
  if (opts.recordCle && opts.recordValeur !== undefined) {
    recordBattu = batRecord(opts.recordCle, opts.recordValeur, opts.recordPlusHaut !== false);
  }

  // Missions du jour (on récolte celles qui se terminent pendant cette session)
  const nouvellesMissions = new Set();
  const recolte = liste => liste.forEach(id => nouvellesMissions.add(id));
  recolte(enregistrerAction('correct', opts.justes, opts.mode));
  recolte(enregistrerAction('parties', 1, opts.mode));
  if (opts.etoiles) recolte(enregistrerAction('etoiles', opts.etoiles, opts.mode));
  if (parfait && opts.justes > 1) recolte(enregistrerAction('parfait', 1, opts.mode));
  recolte(enregistrerAction('jeux', 1, opts.mode));

  const badges = verifierBadges();
  sauverJoueur();
  return { pieces, xp, badges, missionsTerminees: [...nouvellesMissions], recordBattu };
}

function reinitialiser() {
  stockage.del('mq_joueur_v2');
  stockage.del('mq_joueur');
  joueur = null;
}
