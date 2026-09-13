/* ============================================================
   MATH QUEST v2 — engine-quiz.js
   Moteur de quiz réutilisé par la plupart des jeux
   ============================================================ */
'use strict';

let JEU = {};

function lancerNiveau(id) {
  const niveau = NIVEAUX.find(n => n.id === id);
  JEU.dernier = { type: 'niveau', id };
  moteurQuiz({
    titre: `${niveau.emoji} ${niveau.nom}`,
    questions: genereQuestionsNiveau(niveau),
    niveauId: id,
    mode: 'calcul'
  });
}
function lancerTable(n) {
  JEU.dernier = { type: 'table', n };
  moteurQuiz({
    titre: `✖️ Table de ${n}`,
    questions: Array.from({ length: 8 }, () => genereCalcul('mul', 0, 0, n)),
    mode: 'tables'
  });
}
function lancerQuizMode(mode) {
  const meta = MODES.find(m => m.id === mode);
  JEU.dernier = { type: 'mode', mode };
  const nb = mode === 'compte' ? 10 : 8;
  moteurQuiz({
    titre: `${meta.emoji} ${meta.nom}`,
    questions: genereQuestionsMode(mode).slice(0, nb),
    temps: mode === 'compte' ? 8 : null,
    mode
  });
}
function lancerDefiJour() {
  if (joueur.quotidienFait === aujourdhui()) {
    dire('✅ Défi déjà réussi aujourd\'hui, reviens demain !');
    return;
  }
  JEU.dernier = { type: 'defi' };
  moteurQuiz({
    titre: '🎯 Défi du Jour',
    questions: genereDefiJour(),
    bonusPieces: 50,
    mode: 'defi',
    defi: true
  });
}
function lancerBoss() {
  JEU.dernier = { type: 'boss' };
  sfx('boss');
  moteurQuiz({
    titre: '👑 Boss des Maths',
    questions: genereBoss(),
    bonusPieces: 60,
    mode: 'boss',
    boss: true
  });
}

function moteurQuiz(cfg) {
  JEU.quiz = {
    cfg,
    questions: cfg.questions,
    idx: 0, justes: 0, serie: 0, serieMax: 0,
    verrouille: false, tempsRestant: cfg.temps || null,
    timerQuestion: null, enPause: false,
    opStats: { add: 0, sub: 0, mul: 0, div: 0, autre: 0 }
  };
  rendreQuiz();
}

function rendreQuiz() {
  const g = JEU.quiz;
  const q = g.questions[g.idx];
  const total = g.questions.length;
  const cols = q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : '';
  const comparer = q.options.some(o => String(o).includes('plus grand'));
  const points = total <= 15
    ? `<div class="points-progression">${g.questions.map((_, i) =>
        `<span class="point-prog ${i < g.idx ? (g.questions[i]._rate ? 'rate' : 'fait') : i === g.idx ? 'courant' : ''}"></span>`).join('')}</div>`
    : '';
  afficher(`
    <div class="quiz-haut">
      <button class="btn btn-retour" data-act="nav" data-ecran="accueil">🏠</button>
      <div class="qh-titre">
        <div class="qh-nom">${g.cfg.titre}</div>
        <div class="qh-avancee">Question ${g.idx + 1} / ${total} ${g.serie >= 3 ? `• 🔥 ${g.serie}` : ''}</div>
      </div>
      <button class="btn btn-retour" data-act="quiz-pause" title="Pause">⏸️</button>
      <div class="qh-score">🪙 ${g.justes * 2}</div>
    </div>
    <div class="barre-progres"><div style="width:${g.idx / total * 100}%"></div></div>
    ${points}
    ${g.cfg.temps && !g.enPause ? `<div class="barre-temps"><div id="barre-tps" style="width:100%"></div></div>` : ''}
    <div class="zone-question">
      ${g.serie >= 5 ? '<div class="combo-mult">COMBO ×2 🔥</div>' : ''}
      <div class="q-consigne">${q.consigne || ''}</div>
      ${q.visuel}
    </div>
    <div class="reponses ${comparer ? 'comparaison-rep' : ''}" style="${cols}">
      ${q.options.map((o, i) =>
        `<button class="reponse" data-act="repondre" data-i="${i}">${o}</button>`).join('')}
    </div>`);
  if (!g.enPause) lancerQuestion();
}

function lancerQuestion() {
  const g = JEU.quiz;
  g.verrouille = false;
  g.tempsRestant = g.cfg.temps || null;
  if (g.cfg.temps) {
    const barre = $('#barre-tps');
    g.timerQuestion = toutesLes(() => {
      if (g.enPause) return;
      g.tempsRestant -= .1;
      if (barre) barre.style.width = `${Math.max(0, g.tempsRestant / g.cfg.temps * 100)}%`;
      if (g.tempsRestant <= 0) traiterReponse(-1);
    }, 100);
  }
}

function pauseQuiz() {
  const g = JEU.quiz;
  if (!g || g.verrouille) return;
  g.enPause = true;
  clearInterval(g.timerQuestion);
  modale(`
    <div class="m-emoji">⏸️</div>
    <h3>Pause</h3>
    <p class="petit-text mb">On reprend quand tu veux !</p>
    <div class="plusieurs-boutons">
      <button class="btn btn-grand btn-vert" data-act="quiz-reprendre">▶️ Reprendre</button>
      <button class="btn btn-grand btn-rouge" data-act="nav" data-ecran="accueil">🏠 Quitter</button>
    </div>`);
}
function reprendreQuiz() {
  const g = JEU.quiz;
  fermerModale();
  g.enPause = false;
  rendreQuiz();
}

function traiterReponse(i) {
  const g = JEU.quiz;
  if (g.verrouille || g.enPause) return;
  g.verrouille = true;
  clearInterval(g.timerQuestion);
  const q = g.questions[g.idx];
  const boutons = $$('.reponse');
  boutons[q.answer].classList.add('bonne');
  const bon = i === q.answer;
  if (bon) {
    g.justes++; g.serie++; g.serieMax = Math.max(g.serieMax, g.serie);
    g.opStats[q.op || 'autre'] = (g.opStats[q.op || 'autre'] || 0) + 1;
    sfx('bonne', g.serie);
    const piece = g.serie >= 5 ? 4 : 2;
    if (boutons[i]) flottantSurElement(boutons[i], `+${piece} 🪙`, '#b45309');
    explosion(boutons[q.answer].getBoundingClientRect().left + 60, boutons[q.answer].getBoundingClientRect().top + 20, 10);
    const msg = g.serie >= 5 ? `Combo ×${Math.min(5, 1 + Math.floor(g.serie / 5))} ! 🔥`
      : choix(['Correct !', 'Super !', 'Génial !', 'Bravo ! 👏', 'Ouais ! 🎉']);
    afficherFeedback(msg, true);
    if (g.serie === 5 || g.serie === 10 || g.serie === 15) AudioMX.voix('combo', true);
    else AudioMX.voix('bonne');
  } else {
    g.serie = 0; q._rate = true;
    sfx('faute');
    if (i >= 0) boutons[i].classList.add('mauvaise');
    afficherFeedback(i < 0 ? '⏰ Temps écoulé !' : '❌ Faux !', false);
    AudioMX.voix('faute');
  }
  apres(() => {
    g.idx++;
    if (g.idx >= g.questions.length) finirQuiz();
    else rendreQuiz();
  }, 850);
}

function finirQuiz() {
  const g = JEU.quiz;
  const cfg = g.cfg;
  // Mode multijoueur : déléguer
  if (cfg.apresFin) { cfg.apresFin({ justes: g.justes, total: g.questions.length }); return; }

  const total = g.questions.length;
  const ratio = g.justes / total;
  const parfait = g.justes === total;
  const etoiles = ratio >= .999 ? 3 : ratio >= .7 ? 2 : ratio >= .5 ? 1 : 0;

  if (cfg.defi) joueur.quotidienFait = aujourdhui();

  const gain = finSession({
    mode: cfg.mode || 'autre',
    niveauId: cfg.niveauId,
    justes: g.justes, total, serie: g.serieMax,
    etoiles: cfg.niveauId !== undefined || cfg.mode ? etoiles : null,
    parfait,
    opStats: g.opStats,
    bonusPieces: cfg.bonusPieces || 0,
    bonusXP: cfg.bonusXP || 0
  });

  // Écran de résultats
  let emoji, titre;
  if (ratio >= .999) { titre = cfg.boss ? 'Boss vaincu ! 👑' : 'Parfait !'; emoji = cfg.boss ? '👑' : '🏆'; pluieConfettis(150); sfx('niveau'); }
  else if (ratio >= .7) { titre = 'Bravo !'; emoji = '🎉'; pluieConfettis(80); sfx('etoile'); }
  else if (ratio >= .5) { titre = 'Bien joué !'; emoji = '😊'; }
  else { titre = 'On recommence ?'; emoji = '💪'; }

  const prochainNiveau = cfg.niveauId !== undefined && etoiles > 0 && cfg.niveauId < NIVEAUX.length
    ? cfg.niveauId + 1 : null;

  ecranResultats({
    emoji, titre, justes: g.justes, total, serie: g.serieMax,
    etoiles, pieces: gain.pieces, xp: gain.xp,
    badges: gain.badges, missions: gain.missionsTerminees,
    prochainNiveau, defi: !!cfg.defi, boss: !!cfg.boss
  });
}
