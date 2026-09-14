/* ============================================================
   MATH QUEST v3.1 — plus.js
   Hub multijoueur, Course aux Maths (plateau local et en ligne),
   Duel en ligne. Tout est piloté ici ; le réseau est dans multi.js.
   ============================================================ */
'use strict';

const COULEURS_JOUEURS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24'];
const NB_CASES_COURSE = 20;
const CASES_SPECIALES = { 4: 'etoile', 8: 'trou', 12: 'etoile', 16: 'trou' };
const EMOTES = ['😄', '👍', '🔥', '😮', '💪', '🎉'];

let mpNb = 2, mpDiff = 'facile', mpModeLigne = 'duel';

/* ============================================================
   HUB MULTIJOUEUR
   ============================================================ */
function ecranMultijoueur() {
  Multi.quitter(true);
  afficher(entetePage('👥 Jouer à plusieurs', 'jeux') + `
    <div class="carte">
      <div class="section-titre" style="margin-top:0">📱 Sur le même téléphone</div>
      <p class="petit-texte center">On se passe l'appareil à chaque tour, pas besoin d'internet !</p>
      <p class="center mt" style="font-weight:600">Combien de joueurs ?</p>
      <div class="mp-nb">
        ${[2, 3, 4].map(n => `<button class="btn ${mpNb === n ? 'btn-principal' : ''}" data-act="mp-nb" data-n="${n}">${n}</button>`).join('')}
      </div>
      <p class="center mt" style="font-weight:600">Difficulté</p>
      <div class="mp-nb">
        ${[['facile', '🟢 Facile'], ['moyen', '🟡 Moyen'], ['difficile', '🔴 Difficile']].map(([d, l]) =>
          `<button class="btn ${mpDiff === d ? 'btn-principal' : ''}" style="font-size:.95rem" data-act="mp-diff" data-d="${d}">${l}</button>`).join('')}
      </div>
      <div class="mp-boutons mt">
        <button class="btn btn-grand btn-bleu" data-act="mp-duel-local">⚔️ Duel de questions</button>
        <button class="btn btn-grand btn-vert" data-act="mp-course-local">🏁 Course aux Maths</button>
      </div>
    </div>

    <div class="carte">
      <div class="section-titre" style="margin-top:0">🌐 Avec un ami à distance</div>
      <p class="petit-texte center">Chacun sur son téléphone, par internet. Gratuit, sans compte :</p>
      <div class="mp-boutons">
        <button class="btn btn-grand btn-principal" data-act="mp-creer" data-mode="duel">⚔️ Créer un Duel en ligne</button>
        <button class="btn btn-grand btn-vert" data-act="mp-creer" data-mode="course">🏁 Créer une Course en ligne</button>
      </div>
      <div class="mp-rejoindre mt">
        <input id="code-salon" maxlength="5" placeholder="CODE À 5 LETTRES" autocomplete="off"
          style="text-align:center;letter-spacing:6px;font-weight:700;text-transform:uppercase"/>
        <button class="btn btn-grand btn-orange" data-act="mp-rejoindre">Rejoindre ➜</button>
      </div>
      <p class="petit-texte center mt">💡 Celui qui crée reçoit un code, il l'envoie à son ami qui le recopie ici.</p>
    </div>${navHTML('')}`);
}

/* Duel local avec les réglages du hub (noms par défaut + avatars) */
function lancerDuelLocal() {
  const joueurs = Array.from({ length: mpNb }, (_, i) => ({
    avatar: AVATARS[i % AVATARS.length],
    nom: `Joueur ${i + 1}`.slice(0, 14)
  }));
  JEU.feteDiff = mpDiff;
  JEU.fete = { joueurs, questions: genereQuestionsDuel(mpDiff), idx: 0, scores: [] };
  JEU.dernier = { type: 'fete' };
  porteFete();
}

/* ============================================================
   COURSE AUX MATHS — LOCALE (passage de téléphone)
   ============================================================ */
function lancerCourseLocale() {
  const joueurs = Array.from({ length: mpNb }, (_, i) => ({
    id: 'j' + i, nom: 'Joueur ' + (i + 1), avatar: AVATARS[i % AVATARS.length],
    pos: 0, justes: 0, total: 0, couleur: COULEURS_JOUEURS[i]
  }));
  JEU.courseL = {
    joueurs, idx: 0, diff: mpDiff, phase: 'porte', verrouille: false,
    question: null, dernierDe: null, dernierMsg: '', fini: false
  };
  JEU.dernier = { type: 'course-locale' };
  rendrePorteCourseL();
}
function rendrePorteCourseL() {
  const c = JEU.courseL, j = c.joueurs[c.idx];
  afficher(entetePage('🏁 Course aux Maths', 'jeux') + `
    <div class="carte ecran-passe" style="margin-top:24px">
      ${plateauCourseHTML(c.joueurs)}
      <div class="ep-avatar" style="font-size:3.4rem">${j.avatar}</div>
      <h2 class="mt">Au tour de ${echapper(j.nom)} !</h2>
      <p class="mt">Passe l'appareil à <b>${echapper(j.nom)}</b>,<br/>puis appuie quand tu es prêt.</p>
      <button class="btn btn-grand btn-principal mt" data-act="course-pret">Je suis prêt(e) ! 👍</button>
    </div>`);
}
function questionCourseL() {
  const c = JEU.courseL;
  c.question = genereQuestionsDuel(c.diff)[0];
  c.phase = 'question';
  rendreQuestionCourseL();
}
function rendreQuestionCourseL() {
  const c = JEU.courseL, j = c.joueurs[c.idx], q = c.question;
  afficher(entetePage('🏁 Course aux Maths', 'jeux') + `
    <div class="quiz-haut" style="margin-bottom:8px">
      <span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)}</span>
      <div class="qh-score">Case ${j.pos}/${NB_CASES_COURSE}</div>
    </div>
    ${plateauCourseHTML(c.joueurs)}
    <div class="zone-question mt">
      <div class="q-consigne">${q.consigne || 'Combien ça fait ?'}</div>
      ${q.visuel}
    </div>
    <div class="reponses" style="${q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
      ${q.options.map((o, i) => `<button class="reponse" data-act="course-rep-l" data-i="${i}">${o}</button>`).join('')}
    </div>`);
}
function reponseCourseL(i) {
  const c = JEU.courseL;
  if (c.verrouille || c.phase !== 'question') return;
  c.verrouille = true;
  const j = c.joueurs[c.idx], q = c.question;
  const boutons = $$('.reponse');
  boutons[q.answer].classList.add('bonne');
  const bon = i === q.answer;
  j.total++;
  if (bon) {
    j.justes++;
    const de = alea(1, 3);
    j.pos = Math.min(NB_CASES_COURSE, j.pos + de);
    let msg = `➕ ${de} case${de > 1 ? 's' : ''} !`;
    const spec = CASES_SPECIALES[j.pos];
    if (spec === 'etoile') { j.pos = Math.min(NB_CASES_COURSE, j.pos + 1); msg += ' ⭐ +1 bonus !'; }
    if (spec === 'trou') { j.pos = Math.max(0, j.pos - 1); msg += ' 🕳️ −1 case !'; }
    c.dernierDe = de; c.dernierMsg = msg;
    sfx('bonne', j.justes); AudioMX.voix('bonne');
    if (boutons[i]) explosion(boutons[i].getBoundingClientRect().left + 50, boutons[i].getBoundingClientRect().top + 20, 10);
  } else {
    if (boutons[i]) boutons[i].classList.add('mauvaise');
    c.dernierDe = 0; c.dernierMsg = 'Pas de dé cette fois !';
    sfx('faute'); AudioMX.voix('faute');
  }
  c.phase = 'de';
  apres(rendreDeCourseL, 900);
}
function rendreDeCourseL() {
  const c = JEU.courseL, j = c.joueurs[c.idx];
  const gagne = j.pos >= NB_CASES_COURSE;
  afficher(entetePage('🏁 Course aux Maths', 'jeux') + `
    <div class="carte center">
      ${plateauCourseHTML(c.joueurs)}
      <div class="de-resultat">
        <div style="font-size:3rem">${j.avatar}</div>
        ${c.dernierDe ? `<div class="de-de">🎲 ${c.dernierDe}</div>` : '<div class="de-de rate">❌</div>'}
        <div class="de-msg">${c.dernierMsg}</div>
        ${gagne ? '<h2 class="mt">🏁 Arrivée !</h2>' : ''}
      </div>
      ${gagne ? '' : `<button class="btn btn-grand btn-principal mt" data-act="course-suivant-l">Joueur suivant ➜</button>`}
    </div>`);
  // Important : programmer la fin APRÈS afficher() (qui purge les minuteurs en attente)
  if (gagne) apres(finirCourseL, 1400);
}
function suivantCourseL() {
  const c = JEU.courseL;
  c.idx = (c.idx + 1) % c.joueurs.length;
  c.verrouille = false;
  c.phase = 'porte';
  rendrePorteCourseL();
}
function plateauCourseHTML(joueurs) {
  let cases = '';
  for (let n = 0; n <= NB_CASES_COURSE; n++) {
    const ici = joueurs.filter(j => j.pos === n);
    const spec = CASES_SPECIALES[n];
    const fond = n === NB_CASES_COURSE ? 'linear-gradient(135deg,#fde047,#f59e0b)'
      : spec === 'etoile' ? 'linear-gradient(135deg,#fef9c3,#fde047)'
      : spec === 'trou' ? 'linear-gradient(135deg,#e5e7eb,#9ca3af)'
      : '#fff';
    cases += `<div class="case-course ${n === NB_CASES_COURSE ? 'arrivee' : ''}" style="background:${fond}">
      <span class="cc-num">${n === NB_CASES_COURSE ? '🏁' : n}</span>
      <span class="cc-pions">${ici.map(j => `<span title="${echapper(j.nom)}">${j.avatar}</span>`).join('')}</span>
    </div>`;
  }
  return `<div class="plateau-course">${cases}</div>
    <div class="course-joueurs">${joueurs.map(j =>
      `<span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)} • ${j.justes}✅</span>`).join('')}</div>`;
}
function finirCourseL() {
  const c = JEU.courseL;
  c.fini = true;
  const classement = [...c.joueurs].sort((a, b) => b.pos - a.pos || b.justes - a.justes);
  toutArreter();
  // Le propriétaire de l'appareil empoche les pièces de ses bonnes réponses
  // (on compte celles du joueur 1 par simplicité, chaque appareil n'a qu'un profil).
  const totalJustes = c.joueurs.reduce((s, j) => s + j.justes, 0);
  finSession({ mode: 'course', justes: totalJustes, total: c.joueurs.reduce((s, j) => s + j.total, 0),
    serie: 0, etoiles: null, parfait: false, opStats: { autre: totalJustes } });
  podiumCourse(classement, 'course');
}

/* Podium commun (local et en ligne) */
function podiumCourse(classement) {
  const medailles = ['🥇', '🥈', '🥉', '🎖️'];
  afficher(entetePage('🏆 Podium', 'accueil') + `
    <div class="carte">
      <div class="podium-final">
        ${classement.map((j, i) => `
          <div class="ligne-podium ${i === 0 ? 'or1' : i === 1 ? 'or2' : i === 2 ? 'or3' : ''}">
            <span style="font-size:1.5rem">${medailles[i] || '🎖️'}</span>
            <span class="pion-couleur" style="background:${j.couleur || '#94a3b8'}">${j.avatar}</span>
            <span>${echapper(j.nom)}</span>
            <span class="lp-score">${j.pos >= NB_CASES_COURSE ? '🏁' : 'case ' + j.pos} • ${j.justes} ✅</span>
          </div>`).join('')}
      </div>
      <p class="center mt">🎉 Bravo ${echapper(classement[0].nom)} !</p>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-principal" data-act="mp-encore">🔄 Revanche</button>
        <button class="btn btn-grand" data-act="nav" data-ecran="jeux">🏠 Jeux</button>
      </div>
    </div>`);
  pluieConfettis(150); sfx('niveau'); AudioMX.voix('victoire', true);
}

/* ============================================================
   SALON EN LIGNE
   ============================================================ */
function ecranCreerSalon(mode) {
  if (!Multi.disponible()) { dire('🌐 Le mode en ligne nécessite une connexion internet !'); return; }
  mpModeLigne = mode;
  Multi.onLancement = initialiserInviteJeu;
  Multi.creerSalon(mode, rendreSalonLigne);
  rendreSalonLigne();
}
function ecranRejoindreSalon(code) {
  if (!Multi.disponible()) { dire('🌐 Le mode en ligne nécessite une connexion internet !'); return; }
  Multi.onLancement = initialiserInviteJeu;
  Multi.rejoindreSalon(code, rendreSalonLigne);
  rendreSalonLigne();
}

/* Copie / partage du lien d'invitation */
function lienSalon() {
  return location.origin + location.pathname + '?salon=' + Multi.salon.code;
}
function copierLienSalon() {
  const url = lienSalon();
  const ok = () => dire('📋 Lien copié ! Envoie-le à ton ami.');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(ok).catch(() => {
      window.prompt('Copie ce lien :', url); ok();
    });
  } else { window.prompt('Copie ce lien :', url); ok(); }
}
async function partagerLienSalon() {
  const url = lienSalon();
  if (navigator.share) {
    try { await navigator.share({ title: 'Math Quest', text: 'Viens jouer avec moi sur Math Quest !', url }); } catch {}
  } else copierLienSalon();
}

/* Écran d'attente avant la première question (invité) */
function rendreAttenteJeu(titre) {
  afficher(entetePage(titre, 'jeux') + `
    <div class="carte center" style="margin-top:30px">
      <div class="salon-chargement"><div class="spinner"></div>
      <p>L'hôte distribue les questions…<br/>Ça arrive !</p></div>
    </div>`);
}
function rendreSalonLigne() {
  const M = Multi;
  if (!M.salon) return ecranMultijoueur();
  const s = M.salon;
  const hote = M.role === 'hote';
  const url = location.origin + location.pathname + '?salon=' + s.code;
  let corps = '';
  if (s.phase === 'connexion') {
    corps = `<div class="salon-chargement"><div class="spinner"></div><p>Connexion au salon…</p></div>`;
  } else if (s.phase === 'erreur' || s.phase === 'deconnecte' || s.erreur) {
    corps = `<div class="center"><div style="font-size:3rem">📡</div><p class="mt">${echapper(s.erreur || 'Erreur de connexion')}</p>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-principal" data-act="nav" data-ecran="multijoueur">↩️ Réessayer</button>
      </div></div>`;
  } else {
    corps = `
      <p class="center petit-texte">${s.mode === 'course' ? '🏁 Course aux Maths' : '⚔️ Duel de questions'} • ${hote ? 'tu es l\'hôte' : 'salon de ton ami'}</p>
      <div class="code-salon">${s.code.split('').map(c => `<span>${c}</span>`).join('')}</div>
      ${hote ? `<p class="center petit-texte">Envoie ce code (ou le lien) à ton ami :</p>
        <div class="lien-salon">${url}</div>
        <div class="plusieurs-boutons">
          <button class="btn btn-bleu" data-act="mp-copier">📋 Copier le lien</button>
          ${navigator.share ? '<button class="btn btn-vert" data-act="mp-partager">📤 Partager</button>' : ''}
        </div>` : `<p class="center petit-texte">En attente du démarrage…</p>`}
      <div class="salon-joueurs">
        ${s.joueurs.map((j, i) => `<div class="salon-joueur" style="border-color:${COULEURS_JOUEURS[i % 4]}">
          <span style="font-size:1.8rem">${j.avatar}</span>
          <b>${echapper(j.nom)}</b>${i === 0 ? ' <span class="tag-hote">hôte</span>' : ''}
        </div>`).join('')}
      </div>
      ${hote
        ? `<button class="btn btn-grand btn-principal mt" ${s.joueurs.length < 2 ? 'disabled style="opacity:.5"' : ''} data-act="mp-lancer">
             ${s.joueurs.length < 2 ? 'En attente d\'un ami…' : '🚀 Lancer la partie !'}</button>`
        : '<div class="salon-chargement mt"><div class="spinner"></div><p>L\'hôte va bientôt lancer…</p></div>'}
      <div class="emotes mt">
        ${EMOTES.slice(0, 4).map(e => `<button class="btn" data-act="mp-emote" data-e="${e}">${e}</button>`).join('')}
      </div>`;
  }
  afficher(entetePage('🌐 Salon en ligne', 'jeux') + `<div class="carte">${corps}
    <button class="btn btn-rouge mt" data-act="mp-quitter">✖️ Quitter le salon</button>
  </div>`);
}

function lancerPartieLigne() {
  const M = Multi, mode = M.salon.mode;
  M.lancerPartie(mode);
  if (mode === 'duel') preparerDuelLigne();
  else preparerCourseLigne();
}

/* ============================================================
   INSTALLATION CÔTÉ INVITÉ (au signal de lancement de l'hôte)
   ============================================================ */
function initialiserInviteJeu(mode) {
  if (mode === 'duel') initialiserDuelInvite();
  else initialiserCourseInvite();
}
function initialiserDuelInvite() {
  const M = Multi;
  const joueurs = M.salon.joueurs.map((j, i) => ({ ...j, couleur: COULEURS_JOUEURS[i], score: 0 }));
  JEU.duelL = { questions: [], joueurs, idx: 0, reponses: {}, phase: 'attente', verrouille: false, lanceLe: Date.now() };
  M.surReponse = null;
  M.jeu = m => {
    const d = JEU.duelL;
    if (!d) return;
    if (m.t === 'question') {
      // La bonne réponse n'est pas envoyée (secret jusqu'au pointage)
      d.questions[m.idx] = { consigne: m.q.consigne, visuel: m.q.visuel, options: m.q.options };
      d.idx = m.idx; d.reponses = {}; d.phase = 'question';
      d.verrouille = false; d.lanceLe = Date.now();
      rendreDuelLigne();
    } else if (m.t === 'pointage') {
      if (d.questions[m.idx]) d.questions[m.idx].answer = m.bonne;
      d.idx = m.idx; d.reponses = m.reponses; d.joueurs = m.joueurs; d.phase = 'pointage';
      rendreDuelLigne();
    } else if (m.t === 'fin') {
      d.phase = 'fin'; d.joueurs = m.joueurs;
      const moi = m.joueurs.find(j => j.id === M.monId());
      const monScore = moi ? moi.score : 0;
      finSession({ mode: 'duel', justes: monScore, total: 8, serie: 0,
        etoiles: monScore >= 7 ? 3 : monScore >= 4 ? 2 : monScore >= 1 ? 1 : 0,
        parfait: monScore === 8, opStats: { autre: monScore } });
      M.salon.phase = 'fin';
      rendreFinDuelLigne();
    } else if (m.t === 'emote') {
      const j = d.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  rendreAttenteJeu('⚔️ Duel en ligne');
}
function initialiserCourseInvite() {
  const M = Multi;
  JEU.courseLigne = null;
  M.surReponse = null;
  M.jeu = m => {
    if (m.t === 'de') {
      JEU.courseLigne = {
        joueurs: m.joueurs, idx: m.idx, phase: m.phase,
        question: m.question, resultat: m.resultat, fini: false
      };
      rendreCourseLigne();
    } else if (m.t === 'fin') {
      if (JEU.courseLigne) JEU.courseLigne.fini = true;
      const moi = m.classement.find(j => j.id === M.monId());
      finSession({ mode: 'course', justes: moi ? moi.justes : 0, total: moi ? moi.total : 1,
        serie: 0, etoiles: null, parfait: false,
        opStats: { autre: moi ? moi.justes : 0 } });
      M.salon.phase = 'fin';
      podiumCourse(m.classement);
    } else if (m.t === 'emote') {
      const j = JEU.courseLigne && JEU.courseLigne.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  rendreAttenteJeu('🏁 Course en ligne');
}

/* ============================================================
   DUEL EN LIGNE (hôte = arbitre)
   ============================================================ */
function questionNettoyee(q) {
  return { consigne: q.consigne, visuel: q.visuel, options: q.options };
}
function preparerDuelLigne() {
  const M = Multi;
  const diff = mpDiff;
  const questions = Array.from({ length: 8 }, () => genereQuestionsDuel(diff)[0]);
  const joueurs = M.salon.joueurs.map((j, i) => ({ ...j, couleur: COULEURS_JOUEURS[i], score: 0 }));
  JEU.duelL = { questions, joueurs, idx: 0, reponses: {}, phase: 'question', verrouille: false, lanceLe: 0, attendu: 12000 };
  M.surReponse = (pid, m) => {
    const d = JEU.duelL;
    if (!d || d.idx !== m.idx || d.reponses[pid] !== undefined) return;
    d.reponses[pid] = m.i;
    // Si tout le monde a répondu (hôte inclus), on passe au pointage sans attendre 12 s
    verifierCompletDuel();
  };
  M.jeu = m => {
    const d = JEU.duelL;
    if (!d) return;
    if (m.t === 'pointage') { d.reponses = m.reponses; d.joueurs = m.joueurs; d.phase = 'pointage'; rendreDuelLigne(); }
    else if (m.t === 'question') { d.idx = m.idx; d.reponses = {}; d.phase = 'question'; d.lanceLe = Date.now(); d.bonne = null; rendreDuelLigne(); }
    else if (m.t === 'fin') { d.phase = 'fin'; d.joueurs = m.joueurs; rendreFinDuelLigne(); }
    else if (m.t === 'emote') { const j = d.joueurs.find(x => x.id === m.id); afficherEmote(j ? j.avatar : '🙂', m.e); }
  };
  envoyerQuestionDuel(0);
}
function envoyerQuestionDuel(idx) {
  const M = Multi, d = JEU.duelL;
  d.idx = idx; d.reponses = {}; d.phase = 'question'; d.bonne = null;
  d.verrouille = false;
  d.lanceLe = Date.now();
  const q = d.questions[idx];
  M._diffuser({ t: 'question', idx, q: questionNettoyee(q) });
  rendreDuelLigne();
  // 12 s pour répondre, puis pointage
  apres(() => {
    if (!JEU.duelL || JEU.duelL.idx !== idx || JEU.duelL.phase !== 'question') return;
    finaliserQuestionDuel(idx);
  }, 12000);
}
function finaliserQuestionDuel(idx) {
  const M = Multi, d = JEU.duelL;
  if (!d || d.idx !== idx) return;
  const q = d.questions[idx];
  // l'hôte compte sa propre réponse (enregistrée dans d.reponses['hote'])
  d.joueurs.forEach(j => {
    const r = d.reponses[j.id];
    if (r === q.answer) j.score++;
  });
  d.phase = 'pointage';
  M._diffuser({ t: 'pointage', idx, bonne: q.answer, reponses: d.reponses, joueurs: d.joueurs });
  // récompenses locales pour chaque appareil (chacun son profil)
  const monId = M.monId();
  const maRep = d.reponses[monId];
  if (maRep === q.answer) sfx('bonne'); else sfx('faute');
  rendreDuelLigne();
  apres(() => {
    if (!JEU.duelL) return;
    if (idx + 1 >= d.questions.length) finirDuelLigne();
    else envoyerQuestionDuel(idx + 1);
  }, 3000);
}
function repondreDuelLigne(i) {
  const M = Multi, d = JEU.duelL;
  if (!d || d.phase !== 'question' || d.verrouille) return;
  if (d.reponses[M.monId()] !== undefined) return;
  d.verrouille = true;
  const ms = Date.now() - d.lanceLe;
  d.reponses[M.monId()] = i;
  if (M.role === 'hote') {
    // l'hôte peut avancer plus vite si tout le monde a répondu
    verifierCompletDuel();
  } else {
    M.envoyer({ t: 'reponse', idx: d.idx, i, ms });
  }
  rendreDuelLigne();
}
function verifierCompletDuel() {
  const M = Multi, d = JEU.duelL;
  const tous = d.joueurs.every(j => d.reponses[j.id] !== undefined);
  if (tous && d.phase === 'question') finaliserQuestionDuel(d.idx);
}
function rendreDuelLigne() {
  const M = Multi, d = JEU.duelL;
  if (!d) return;
  const q = d.questions[d.idx];
  const monId = M.monId();
  const maRep = d.reponses[monId];
  let corps = '';
  // scores
  corps += `<div class="course-joueurs">${d.joueurs.map(j =>
    `<span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)} • ${j.score}⭐</span>`).join('')}</div>`;
  if (d.phase === 'question') {
    const repondu = maRep !== undefined;
    corps += `<div class="zone-question mt">
        <div class="q-consigne">Question ${d.idx + 1}/${d.questions.length} • ${q.consigne || 'Combien ça fait ?'}</div>
        ${q.visuel}
      </div>
      <div class="reponses" style="${q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
        ${q.options.map((o, i) => `<button class="reponse ${repondu && i === maRep ? 'bonne' : ''} ${repondu ? 'inactif' : ''}"
          data-act="duel-ligne-rep" data-i="${i}" ${repondu ? 'disabled' : ''}>${o}</button>`).join('')}
      </div>
      ${repondu ? '<p class="center petit-texte mt">Réponse envoyée, en attente des autres… ⏳</p>' : ''}`;
  } else if (d.phase === 'pointage') {
    corps += `<div class="zone-question mt">
        <div class="q-consigne">Question ${d.idx + 1} : la bonne réponse</div>
        ${q.visuel}
        <div class="bonne-reponse-ligne">✅ ${q.options[q.answer]}</div>
      </div>
      <div class="reponses" style="${q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
        ${q.options.map((o, i) => `<button class="reponse ${i === q.answer ? 'bonne' : (i === maRep ? 'mauvaise' : 'inactif')}" disabled>${o}</button>`).join('')}
      </div>`;
  }
  afficher(entetePage('⚔️ Duel en ligne', 'jeux') + `<div class="carte">${corps}
    <div class="emotes mt">${EMOTES.map(e => `<button class="btn" data-act="mp-emote" data-e="${e}">${e}</button>`).join('')}</div>
  </div>`);
  // À chaque réponse de l'hôte, vérifier la complétion
  if (M.role === 'hote' && d.phase === 'question' && d.reponses['hote'] !== undefined) verifierCompletDuel();
}
function finirDuelLigne() {
  const M = Multi, d = JEU.duelL;
  const monId = M.monId();
  const monScore = (d.joueurs.find(j => j.id === monId) || {}).score || 0;
  const total = d.questions.length;
  finSession({ mode: 'duel', justes: monScore, total, serie: 0, etoiles: monScore >= 7 ? 3 : monScore >= 4 ? 2 : monScore >= 1 ? 1 : 0,
    parfait: monScore === total, opStats: { autre: monScore } });
  const classement = [...d.joueurs].sort((a, b) => b.score - a.score);
  M._diffuser({ t: 'fin', joueurs: classement });
  rendreFinDuelLigne();
}
function rendreFinDuelLigne() {
  const M = Multi, d = JEU.duelL;
  const classement = [...d.joueurs].sort((a, b) => b.score - a.score);
  const medailles = ['🥇', '🥈', '🥉', '🎖️'];
  afficher(entetePage('🏆 Résultats du duel', 'jeux') + `
    <div class="carte">
      <div class="podium-final">
        ${classement.map((j, i) => `<div class="ligne-podium ${i === 0 ? 'or1' : i === 1 ? 'or2' : i === 2 ? 'or3' : ''}">
          <span style="font-size:1.5rem">${medailles[i] || '🎖️'}</span>
          <span class="pion-couleur" style="background:${j.couleur || '#94a3b8'}">${j.avatar}</span>
          <span>${echapper(j.nom)}</span>
          <span class="lp-score">${j.score} ⭐</span>
        </div>`).join('')}
      </div>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-principal" data-act="mp-encore-ligne">🔄 Revanche</button>
        <button class="btn btn-grand" data-act="mp-quitter-jeu">🏠 Quitter</button>
      </div>
    </div>`);
  pluieConfettis(150); sfx('niveau');
  const moi = classement.find(j => j.id === M.monId());
  if (moi === classement[0]) AudioMX.voix('victoire', true); else AudioMX.voix('bravo', true);
  M.salon.phase = 'fin';
}

/* ============================================================
   COURSE EN LIGNE (hôte = arbitre, tour par tour)
   ============================================================ */
function preparerCourseLigne() {
  const M = Multi;
  const joueurs = M.salon.joueurs.map((j, i) => ({
    ...j, couleur: COULEURS_JOUEURS[i], pos: 0, justes: 0, total: 0
  }));
  JEU.courseLigne = { joueurs, idx: 0, phase: 'porte', question: null, reponses: {}, fini: false };
  M.surReponse = (pid, m) => {
    const c = JEU.courseLigne;
    if (!c || c.phase !== 'question') return;
    const actif = c.joueurs[c.idx];
    if (pid !== actif.id) return;
    c.reponseInvite = m.i;
    appliquerTourLigne(pid, m.i);
  };
  M.jeu = m => {
    const c = JEU.courseLigne;
    if (!c) return;
    if (m.t === 'de') {
      JEU.courseLigne = m.etat;
      JEU.courseLigne.phase = m.phase;
      JEU.courseLigne.question = m.question || null;
      JEU.courseLigne.resultat = m.resultat || null;
      JEU.courseLigne.idx = m.idx;
      rendreCourseLigne();
    } else if (m.t === 'fin') {
      JEU.courseLigne.fini = true;
      podiumCourse(m.classement);
    } else if (m.t === 'emote') {
      const j = c.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  lancerTourLigne(0);
}
function etatCourse() {
  const c = JEU.courseLigne;
  return {
    joueurs: JSON.parse(JSON.stringify(c.joueurs)), idx: c.idx, phase: c.phase,
    question: c.question ? { ...questionNettoyee(c.question), answer: c.question.answer } : null,
    resultat: c.resultat || null
  };
}
function lancerTourLigne(idx) {
  const M = Multi, c = JEU.courseLigne;
  c.idx = idx; c.phase = 'porte'; c.question = null; c.resultat = null;
  M._diffuser({ t: 'de', ...etatCourse(), pasDeSuite: true });
  rendreCourseLigne();
  apres(() => envoyerQuestionCourse(idx), 2200);
}
function envoyerQuestionCourse(idx) {
  const M = Multi, c = JEU.courseLigne;
  if (!JEU.courseLigne || c.fini) return;
  c.question = genereQuestionsDuel(mpDiff)[0];
  c.phase = 'question'; c.reponses = {};
  // Tour par tour : la bonne réponse peut voyager (pas de duel simultané)
  M._diffuser({ t: 'de', ...etatCourse() });
  rendreCourseLigne();
  // Sécurité : si le joueur actif ne répond pas (déconnexion), au bout de 15 s on passe
  apres(() => {
    if (!JEU.courseLigne || c.fini || c.phase !== 'question' || c.idx !== idx) return;
    appliquerTourLigne(c.joueurs[idx].id, -1);
  }, 15000);
}
function appliquerTourLigne(pid, i) {
  const M = Multi, c = JEU.courseLigne;
  if (!c || c.phase !== 'question') return;
  const j = c.joueurs[c.idx];
  if (pid !== j.id) return;
  const q = c.question;
  j.total++;
  let bon = false, msg = 'Pas de dé cette fois !', de = 0;
  if (i === q.answer) {
    bon = true; j.justes++;
    de = alea(1, 3); j.pos = Math.min(NB_CASES_COURSE, j.pos + de);
    msg = `➕ ${de} case${de > 1 ? 's' : ''} !`;
    const spec = CASES_SPECIALES[j.pos];
    if (spec === 'etoile') { j.pos = Math.min(NB_CASES_COURSE, j.pos + 1); msg += ' ⭐ +1 !'; }
    if (spec === 'trou') { j.pos = Math.max(0, j.pos - 1); msg += ' 🕳️ −1 !'; }
  }
  c.resultat = { id: j.id, bon, de, msg, arrivee: j.pos >= NB_CASES_COURSE };
  c.phase = 'de';
  sfx(bon ? 'bonne' : 'faute');
  M._diffuser({ t: 'de', ...etatCourse() });
  rendreCourseLigne();
  if (j.pos >= NB_CASES_COURSE) {
    apres(finirCourseLigne, 2600);
  } else {
    const prochain = (c.idx + 1) % c.joueurs.length;
    apres(() => envoyerTourSuivantLigne(prochain), 2800);
  }
}
function envoyerTourSuivantLigne(idx) {
  if (!JEU.courseLigne || JEU.courseLigne.fini) return;
  lancerTourLigne(idx);
}
function repondreCourseLigne(i) {
  const M = Multi, c = JEU.courseLigne;
  if (!c || c.phase !== 'question') return;
  const actif = c.joueurs[c.idx];
  if (M.monId() !== actif.id) return;
  if (M.role === 'hote') appliquerTourLigne('hote', i);
  else M.envoyer({ t: 'reponse', i });
}
function rendreCourseLigne() {
  const M = Multi, c = JEU.courseLigne;
  if (!c) return;
  const j = c.joueurs[c.idx];
  const monTour = M.monId() === j.id;
  let corps = plateauCourseHTML(c.joueurs);
  if (c.phase === 'porte') {
    corps += `<div class="carte ecran-passe" style="margin-top:14px;box-shadow:none">
      <div class="ep-avatar">${j.avatar}</div>
      <h2>Au tour de ${echapper(j.nom)}</h2>
      <p class="petit-texte">Prépare-toi…</p>
    </div>`;
  } else if (c.phase === 'question') {
    corps += `<div class="quiz-haut mt">
      <span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)}</span>
      <span>${monTour ? 'À TOI !' : 'Réfléchis…'}</span>
    </div>
    <div class="zone-question">
      <div class="q-consigne">${c.question.consigne || 'Combien ça fait ?'}</div>
      ${c.question.visuel}
    </div>
    <div class="reponses" style="${c.question.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
      ${c.question.options.map((o, i) =>
        `<button class="reponse ${!monTour ? 'inactif' : ''}" data-act="course-ligne-rep" data-i="${i}" ${monTour ? '' : 'disabled'}>${o}</button>`).join('')}
    </div>`;
  } else if (c.phase === 'de') {
    const r = c.resultat;
    corps += `<div class="de-resultat mt">
      <div style="font-size:3rem">${j.avatar}</div>
      ${r.de ? `<div class="de-de">🎲 ${r.de}</div>` : '<div class="de-de rate">❌</div>'}
      <div class="de-msg">${r.msg}</div>
      ${!r.bon && c.question ? `<div class="petit-texte mt">Bonne réponse : <b>${c.question.options[c.question.answer]}</b></div>` : ''}
    </div>`;
  }
  afficher(entetePage('🏁 Course en ligne', 'jeux') + `<div class="carte">${corps}
    <div class="emotes mt">${EMOTES.map(e => `<button class="btn" data-act="mp-emote" data-e="${e}">${e}</button>`).join('')}</div>
  </div>`);
}
function finirCourseLigne() {
  const M = Multi, c = JEU.courseLigne;
  if (c.fini) return;
  c.fini = true;
  const classement = [...c.joueurs].sort((a, b) => b.pos - a.pos || b.justes - a.justes);
  const moi = c.joueurs.find(j => j.id === M.monId());
  finSession({ mode: 'course', justes: moi ? moi.justes : 0, total: moi ? moi.total : 1,
    serie: 0, etoiles: null, parfait: false, opStats: { autre: moi ? moi.justes : 0 } });
  M._diffuser({ t: 'fin', classement });
  podiumCourse(classement);
  M.salon.phase = 'fin';
}

/* Petite animation d'emote reçue */
function afficherEmote(avatar, e) {
  const div = document.createElement('div');
  div.className = 'emote-flottante';
  div.innerHTML = `<span class="emote-avatar">${avatar}</span><span class="emote-bulle">${e}</span>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1800);
}
