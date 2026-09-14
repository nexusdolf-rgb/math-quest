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
const DUREE_RAPIDO = 30000; // 30 secondes
const NB_QUESTIONS_RAPIDO = 60; // réservoir (personne ne l'épuise en 30 s)
const NB_QUESTIONS_COOP = 10;
const TITRES_MODES = { duel: '⚔️ Duel de questions', course: '🏁 Course aux Maths', rapido: '⚡ Rapido', coop: '🤝 Mission Coop' };

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
      <div class="mp-boutons mp-grille mt">
        <button class="btn btn-grand btn-bleu" data-act="mp-duel-local">⚔️<br/><span>Duel</span></button>
        <button class="btn btn-grand btn-vert" data-act="mp-course-local">🏁<br/><span>Course</span></button>
        <button class="btn btn-grand btn-orange" data-act="mp-rapido-local">⚡<br/><span>Rapido</span></button>
      </div>
      <p class="petit-texte center mt">⚡ Rapido : 30 secondes, un maximum de bonnes réponses !</p>
    </div>

    <div class="carte">
      <div class="section-titre" style="margin-top:0">🌐 Avec un ami à distance</div>
      <p class="petit-texte center">Chacun sur son téléphone, par internet. Gratuit, sans compte :</p>
      <div class="mp-boutons mp-grille mp-grille-4">
        <button class="btn btn-grand btn-principal" data-act="mp-creer" data-mode="duel">⚔️<span>Duel</span></button>
        <button class="btn btn-grand btn-vert" data-act="mp-creer" data-mode="course">🏁<span>Course</span></button>
        <button class="btn btn-grand btn-orange" data-act="mp-creer" data-mode="rapido">⚡<span>Rapido</span></button>
        <button class="btn btn-grand btn-bleu" data-act="mp-creer" data-mode="coop">🤝<span>Coop</span></button>
      </div>
      <p class="petit-texte center mt">🤝 Coop : faites équipe pour réussir la mission ensemble !</p>
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
   RAPIDO — LOCAL (passage de téléphone, 30 s par joueur)
   ============================================================ */
function lancerRapidoLocale() {
  const joueurs = Array.from({ length: mpNb }, (_, i) => ({
    id: 'r' + i, nom: 'Joueur ' + (i + 1), avatar: AVATARS[i % AVATARS.length],
    couleur: COULEURS_JOUEURS[i], justes: 0, total: 0
  }));
  JEU.rapidoL = {
    joueurs, idx: 0, diff: mpDiff, phase: 'porte', question: null,
    restant: DUREE_RAPIDO, timer: null, verrouille: false, fini: false
  };
  JEU.dernier = { type: 'rapido-locale' };
  rendrePorteRapidoL();
}
function rendrePorteRapidoL() {
  const c = JEU.rapidoL, j = c.joueurs[c.idx];
  afficher(entetePage('⚡ Rapido', 'jeux') + `
    <div class="carte ecran-passe" style="margin-top:24px">
      ${classementRapidoHTML(c.joueurs)}
      <div class="ep-avatar" style="font-size:3.4rem">${j.avatar}</div>
      <h2 class="mt">Au tour de ${echapper(j.nom)} !</h2>
      <p class="mt">Tu as <b>30 secondes</b> pour répondre au maximum de questions.<br/>Passe l'appareil puis appuie.</p>
      <button class="btn btn-grand btn-orange mt" data-act="rapido-pret">C'est parti ! ⚡</button>
    </div>`);
}
function questionRapidoL() {
  const c = JEU.rapidoL;
  c.restant = DUREE_RAPIDO; c.verrouille = false; c.phase = 'question';
  c.question = genereQuestionsDuel(c.diff)[0];
  clearInterval(c.timer);
  rendreRapidoL();
  c.timer = toutesLes(() => {
    c.restant -= 100;
    const barre = $('#rapido-barre'), ch = $('#rapido-chrono');
    if (barre) barre.style.width = Math.max(0, c.restant / DUREE_RAPIDO * 100) + '%';
    if (ch) ch.textContent = Math.ceil(c.restant / 1000);
    if (c.restant <= 6000 && barre) barre.parentElement.classList.add('danger');
    if (c.restant <= 0) finirRapidoJoueurL();
  }, 100);
}
function rendreRapidoL() {
  const c = JEU.rapidoL, j = c.joueurs[c.idx], q = c.question;
  afficher(entetePage('⚡ Rapido', 'jeux') + `
    <div class="quiz-haut" style="margin-bottom:8px">
      <span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)}</span>
      <div class="rapido-chrono" id="rapido-chrono">${Math.ceil(c.restant / 1000)}</div>
    </div>
    <div class="barre-temps rapido-barre"><div id="rapido-barre" style="width:100%"></div></div>
    <div class="rapido-score">✅ ${j.justes} bonne réponse${j.justes > 1 ? "s" : ""}</div>
    <div class="zone-question mt" style="min-height:120px;margin-bottom:12px">
      <div class="q-consigne">${q.consigne || 'Combien ça fait ?'}</div>
      ${q.visuel}
    </div>
    <div class="reponses" style="${q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
      ${q.options.map((o, i) => `<button class="reponse" data-act="rapido-rep-l" data-i="${i}">${o}</button>`).join('')}
    </div>`);
}
function reponseRapidoL(i) {
  const c = JEU.rapidoL;
  if (c.verrouille || c.phase !== 'question') return;
  c.verrouille = true;
  const j = c.joueurs[c.idx], q = c.question;
  const boutons = $$('.reponse');
  const bon = i === q.answer;
  j.total++;
  if (bon) {
    j.justes++;
    boutons[q.answer].classList.add('bonne');
    sfx('bonne', j.justes); AudioMX.voix('bonne');
  } else {
    if (boutons[i]) boutons[i].classList.add('mauvaise');
    sfx('faute');
  }
  apres(() => {
    if (!JEU.rapidoL || JEU.rapidoL.phase !== 'question') return;
    questionSuivanteRapidoL();
  }, 420);
}
function questionSuivanteRapidoL() {
  const c = JEU.rapidoL;
  if (c.phase !== 'question') return;
  c.question = genereQuestionsDuel(c.diff)[0];
  c.verrouille = false;
  rendreRapidoL();
}
function finirRapidoJoueurL() {
  const c = JEU.rapidoL;
  if (c.phase !== 'question') return;
  clearInterval(c.timer);
  c.phase = 'fin-joueur';
  if (c.idx + 1 < c.joueurs.length) {
    c.idx++;
    rendrePorteRapidoL();
  } else finirRapidoLocal();
}
function finirRapidoLocal() {
  const c = JEU.rapidoL;
  c.fini = true;
  const totalJustes = c.joueurs.reduce((s, j) => s + j.justes, 0);
  const totalTentatives = c.joueurs.reduce((s, j) => s + j.total, 0);
  toutArreter();
  finSession({ mode: 'rapido', justes: totalJustes, total: Math.max(1, totalTentatives),
    serie: 0, etoiles: null, parfait: false, opStats: { autre: totalJustes } });
  podiumRapido(c.joueurs.map(j => ({ ...j })));
}

/* Podium Rapido (local et en ligne) : rangs par bonnes réponses */
function classementRapidoHTML(joueurs) {
  const tries = [...joueurs].sort((a, b) => b.justes - a.justes);
  const rang = j => tries.findIndex(x => x.id === j.id) + 1;
  const medaille = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '';
  return `<div class="rapido-classement">${joueurs.map(j =>
    `<span class="jeton-joueur" style="background:${j.couleur}">${medaille(rang(j))} ${j.avatar} ${echapper(j.nom)} • ${j.justes}✅</span>`).join('')}</div>`;
}
function podiumRapido(joueurs, enLigne = false) {
  const tries = [...joueurs].sort((a, b) => b.justes - a.justes || (b.total || 0) - (a.total || 0));
  const medailles = ['🥇', '🥈', '🥉', '🎖️'];
  afficher(entetePage('🏆 Résultats Rapido', 'accueil') + `
    <div class="carte">
      <div class="podium-final">
        ${tries.map((j, i) => `<div class="ligne-podium ${i === 0 ? 'or1' : i === 1 ? 'or2' : i === 2 ? 'or3' : ''}">
          <span style="font-size:1.5rem">${medailles[i] || '🎖️'}</span>
          <span class="pion-couleur" style="background:${j.couleur || '#94a3b8'}">${j.avatar}</span>
          <span>${echapper(j.nom)}</span>
          <span class="lp-score">${j.justes} ✅</span>
        </div>`).join('')}
      </div>
      <p class="center mt">🎉 ${tries.length > 1 ? `Bravo ${echapper(tries[0].nom)} !` : 'Bien joué !'}</p>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-principal" data-act="${enLigne ? 'mp-encore-ligne' : 'mp-encore'}">🔄 Revanche</button>
        <button class="btn btn-grand" data-act="${enLigne ? 'mp-quitter-jeu' : 'nav'}" ${enLigne ? '' : 'data-ecran="jeux"'}>🏠 ${enLigne ? 'Quitter' : 'Jeux'}</button>
      </div>
    </div>`);
  pluieConfettis(150); sfx('niveau');
  const M = Multi;
  if (M.role && tries[0] && tries[0].id === M.monId()) AudioMX.voix('victoire', true); else AudioMX.voix('bravo', true);
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
      <p class="center petit-texte">${TITRES_MODES[s.mode] || '🎲 Partie'} • ${hote ? 'tu es l\'hôte' : 'salon de ton ami'}</p>
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
  else if (mode === 'course') preparerCourseLigne();
  else if (mode === 'rapido') preparerRapidoLigne();
  else if (mode === 'coop') preparerCoopLigne();
}

/* ============================================================
   INSTALLATION CÔTÉ INVITÉ (au signal de lancement de l'hôte)
   ============================================================ */
function initialiserInviteJeu(mode) {
  if (mode === 'duel') initialiserDuelInvite();
  else if (mode === 'course') initialiserCourseInvite();
  else if (mode === 'rapido') initialiserRapidoInvite();
  else if (mode === 'coop') initialiserCoopInvite();
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

/* ============================================================
   RAPIDO EN LIGNE — 30 s chrono, chacun avance à son rythme
   L'hôte envoie la banque de questions (sans les réponses),
   valide les réponses reçues et centralise les scores.
   ============================================================ */
function preparerRapidoLigne() {
  const M = Multi;
  const questions = Array.from({ length: NB_QUESTIONS_RAPIDO }, () => genereQuestionsDuel(mpDiff)[0]);
  const joueurs = M.salon.joueurs.map((j, i) => ({ ...j, couleur: COULEURS_JOUEURS[i], justes: 0, total: 0 }));
  JEU.rapidoOn = { joueurs, questions, reponses: {}, fini: false, finAt: 0 };
  M.surReponse = (pid, m) => {
    const r = JEU.rapidoOn;
    if (!r || r.fini || m.kind !== 'rapido') return;
    const q = r.questions[m.idx];
    const j = r.joueurs.find(x => x.id === pid);
    if (!q || !j) return;
    j.total++;
    if (m.i === q.answer) j.justes++;
    M._diffuser({ t: 'rapido-points', joueurs: r.joueurs });
  };
  M.jeu = m => {
    const r = JEU.rapidoOn;
    if (!r) return;
    if (m.t === 'rapido-points') {
      m.joueurs.forEach(jj => { const j = r.joueurs.find(x => x.id === jj.id); if (j) { j.justes = jj.justes; j.total = jj.total; } });
      const el = document.getElementById('rapido-live');
      if (el) el.innerHTML = r.joueurs.map(j =>
        `<span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${j.justes}✅</span>`).join('');
    } else if (m.t === 'rapido-fin') {
      r.fini = true;
      r.joueurs = m.joueurs;
      if (M.salon) M.salon.phase = 'fin';
      podiumRapido(m.joueurs, true);
    } else if (m.t === 'emote') {
      const j = r.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  // L'hôte joue aussi (il garde les bonnes réponses) et lance tout le monde
  JEU.rapidoLocal = null;
  M._diffuser({ t: 'rapido-start', questions: questions.map(questionNettoyee), finAt: Date.now() + DUREE_RAPIDO + 700 });
  ouvrirRapidoJoueur(true, questions, DUREE_RAPIDO);
  apres(() => { if (JEU.rapidoOn) finirRapidoLigne(); }, DUREE_RAPIDO + 700);
}
function repondreRapidoLigne(i) {
  const M = Multi, c = JEU.rapidoLocal;
  if (!c || c.verrouille || c.phase !== 'question') return;
  c.verrouille = true;
  const q = c.questions[c.idx];
  const boutons = $$('.reponse');
  let bon = null;
  if (q.answer === undefined || q.answer === null) {
    // Invité : la bonne réponse reste secrète (arbitrage de l'hôte)
    if (boutons[i]) boutons[i].classList.add('bonne');
    c.total++;
    M.envoyer({ t: 'reponse', kind: 'rapido', idx: c.idx, i });
    sfx('clic');
  } else {
    bon = i === q.answer;
    if (boutons[q.answer]) boutons[q.answer].classList.add('bonne');
    if (!bon && boutons[i]) boutons[i].classList.add('mauvaise');
    c.justes += bon ? 1 : 0; c.total++;
    if (M.role === 'hote') {
      const r = JEU.rapidoOn, j = r.joueurs.find(x => x.id === 'hote');
      j.total++; if (bon) j.justes++;
    }
    sfx(bon ? 'bonne' : 'faute');
  }
  apres(() => {
    if (!JEU.rapidoLocal || JEU.rapidoLocal.phase !== 'question') return;
    c.idx++; c.verrouille = false;
    if (c.idx >= c.questions.length) { rendreAttenteRapido('Bien joué ! En attente des autres…'); return; }
    rendreRapidoQuestionLigne();
  }, 380);
}
function ouvrirRapidoJoueur(hote, questions, dureeMs) {
  JEU.rapidoLocal = {
    questions, idx: 0, justes: 0, total: 0,
    phase: 'question', verrouille: false, timer: null,
    finAt: Date.now() + dureeMs
  };
  rendreRapidoQuestionLigne();
  JEU.rapidoLocal.timer = toutesLes(() => {
    const c = JEU.rapidoLocal;
    if (!c) return;
    const restant = c.finAt - Date.now();
    const barre = $('#rapido-barre'), ch = $('#rapido-chrono2');
    if (barre) barre.style.width = Math.max(0, restant / DUREE_RAPIDO * 100) + '%';
    if (ch) ch.textContent = Math.max(0, Math.ceil(restant / 1000));
    if (restant <= 0) {
      clearInterval(c.timer); c.phase = 'attente';
      if (Multi.role === 'hote') { if (JEU.rapidoOn) finirRapidoLigne(); }
      else rendreAttenteRapido('Temps écoulé ! En attente des autres…');
    }
  }, 100);
}
function rendreRapidoQuestionLigne() {
  const M = Multi, c = JEU.rapidoLocal;
  if (!c) return;
  const q = c.questions[c.idx];
  afficher(entetePage('⚡ Rapido', 'jeux') + `<div class="carte">
    <div class="quiz-haut">
      <span class="jeton-joueur" style="background:linear-gradient(135deg,#fbbf24,#f97316)">⚡ ${c.justes} ✅</span>
      <div class="rapido-chrono" id="rapido-chrono2">30</div>
    </div>
    <div class="barre-temps rapido-barre"><div id="rapido-barre" style="width:100%"></div></div>
    <div id="rapido-live" class="course-joueurs mt"></div>
    <div class="zone-question mt" style="min-height:120px;margin-bottom:12px">
      <div class="q-consigne">${q.consigne || 'Combien ça fait ?'}</div>${q.visuel}
    </div>
    <div class="reponses" style="${q.options.length === 3 ? 'grid-template-columns:1fr 1fr 1fr' : ''}">
      ${q.options.map((o, i) => `<button class="reponse" data-act="rapido-ligne-rep" data-i="${i}">${o}</button>`).join('')}
    </div>
    <div class="emotes mt">${EMOTES.map(e => `<button class="btn" data-act="mp-emote" data-e="${e}">${e}</button>`).join('')}</div>
  </div>`);
}
function rendreAttenteRapido(texte) {
  afficher(entetePage('⚡ Rapido', 'jeux') + `
    <div class="carte center" style="margin-top:30px">
      <div style="font-size:3rem">⚡</div>
      <h2 class="mt">${texte}</h2>
      <div class="salon-chargement"><div class="spinner"></div></div>
    </div>`);
}
function finirRapidoLigne() {
  const M = Multi, r = JEU.rapidoOn;
  if (!r || r.fini) return;
  r.fini = true;
  const moi = r.joueurs.find(j => j.id === M.monId());
  finSession({ mode: 'rapido', justes: moi ? moi.justes : 0, total: Math.max(1, moi ? moi.total : 1),
    serie: 0, etoiles: null, parfait: false, opStats: { autre: moi ? moi.justes : 0 } });
  const tries = [...r.joueurs].sort((a, b) => b.justes - a.justes || b.total - a.total);
  M._diffuser({ t: 'rapido-fin', joueurs: tries });
  if (M.salon) M.salon.phase = 'fin';
  podiumRapido(tries, true);
}
function initialiserRapidoInvite() {
  const M = Multi;
  M.surReponse = null;
  JEU.rapidoOn = null; JEU.rapidoLocal = null;
  M.jeu = m => {
    if (m.t === 'rapido-start') {
      ouvrirRapidoJoueur(false, m.questions, m.finAt - Date.now());
    } else if (m.t === 'rapido-points') {
      const el = document.getElementById('rapido-live');
      if (el) el.innerHTML = m.joueurs.map(jj =>
        `<span class="jeton-joueur" style="background:${jj.couleur || '#94a3b8'}">${jj.avatar || '🙂'} ${jj.justes}✅</span>`).join('');
    } else if (m.t === 'rapido-fin') {
      if (JEU.rapidoLocal) { clearInterval(JEU.rapidoLocal.timer); JEU.rapidoLocal.phase = 'fin'; }
      const moi = m.joueurs.find(j => j.id === M.monId());
      finSession({ mode: 'rapido', justes: moi ? moi.justes : 0, total: Math.max(1, moi ? moi.total : 1),
        serie: 0, etoiles: null, parfait: false, opStats: { autre: moi ? moi.justes : 0 } });
      if (M.salon) M.salon.phase = 'fin';
      podiumRapido(m.joueurs, true);
    } else if (m.t === 'emote') {
      const j = M.salon.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  rendreAttenteJeu('⚡ Rapido');
}

/* ============================================================
   MISSION COOP EN LIGNE — 10 questions, l'équipe gagne ensemble
   Chaque bonne réponse remplit la caisse commune ; objectif 75 %.
   ============================================================ */
function objectifCoop(nbJoueurs) { return Math.ceil(nbJoueurs * NB_QUESTIONS_COOP * .7); }
function preparerCoopLigne() {
  const M = Multi;
  const questions = Array.from({ length: NB_QUESTIONS_COOP }, () => genereQuestionsDuel(mpDiff)[0]);
  const joueurs = M.salon.joueurs.map((j, i) => ({ ...j, couleur: COULEURS_JOUEURS[i], score: 0 }));
  JEU.coopOn = { questions, joueurs, idx: 0, reponses: {}, phase: 'question', objectif: objectifCoop(joueurs.length) };
  M.surReponse = (pid, m) => {
    const c = JEU.coopOn;
    if (!c || m.kind !== 'coop' || c.idx !== m.idx || c.reponses[pid] !== undefined) return;
    c.reponses[pid] = m.i;
    verifierCompletCoop();
  };
  M.jeu = m => {
    const c = JEU.coopOn;
    if (!c) return;
    if (m.t === 'coop-pointage') {
      c.idx = m.idx; c.reponses = m.reponses; c.joueurs = m.joueurs; c.phase = 'pointage';
      rendreCoopLigne();
    } else if (m.t === 'coop-start') {
      c.questions = m.questions.map(q => ({ ...q, answer: undefined }));
      c.idx = m.idx; c.reponses = {}; c.phase = 'question'; c.verrouille = false;
      c.joueurs = m.joueurs; c.objectif = m.objectif;
      rendreCoopLigne();
    } else if (m.t === 'coop-fin') {
      c.phase = 'fin'; c.joueurs = m.joueurs; c.reussi = m.reussi; c.totalEquipe = m.totalEquipe;
      rendreFinCoop();
    } else if (m.t === 'emote') {
      const j = c.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  envoyerQuestionCoop(0);
}
function envoyerQuestionCoop(idx) {
  const M = Multi, c = JEU.coopOn;
  c.idx = idx; c.reponses = {}; c.phase = 'question'; c.verrouille = false;
  const q = c.questions[idx];
  M._diffuser({ t: 'coop-start', idx, questions: c.questions.map(questionNettoyee),
    joueurs: c.joueurs.map(({ id, nom, avatar, couleur, score }) => ({ id, nom, avatar, couleur, score })),
    objectif: c.objectif });
  rendreCoopLigne();
  apres(() => {
    if (JEU.coopOn && JEU.coopOn.idx === idx && JEU.coopOn.phase === 'question') finaliserCoop(idx);
  }, 15000);
}
function repondreCoopLigne(i) {
  const M = Multi, c = JEU.coopOn;
  if (!c || c.phase !== 'question' || c.verrouille || c.reponses[M.monId()] !== undefined) return;
  c.verrouille = true;
  c.reponses[M.monId()] = i;
  if (M.role === 'hote') verifierCompletCoop();
  else M.envoyer({ t: 'reponse', kind: 'coop', idx: c.idx, i });
  rendreCoopLigne();
}
function verifierCompletCoop() {
  const c = JEU.coopOn;
  if (c.phase === 'question' && c.joueurs.every(j => c.reponses[j.id] !== undefined)) finaliserCoop(c.idx);
}
function finaliserCoop(idx) {
  const M = Multi, c = JEU.coopOn;
  if (!c || c.idx !== idx || c.phase !== 'question') return;
  const q = c.questions[idx];
  c.joueurs.forEach(j => { if (c.reponses[j.id] === q.answer) j.score++; });
  c.phase = 'pointage';
  M._diffuser({ t: 'coop-pointage', idx, bonne: q.answer, reponses: c.reponses,
    joueurs: c.joueurs.map(({ id, nom, avatar, couleur, score }) => ({ id, nom, avatar, couleur, score })) });
  const monId = M.monId(), maRep = c.reponses[monId];
  sfx(maRep === q.answer ? 'bonne' : 'faute');
  rendreCoopLigne();
  apres(() => {
    if (!JEU.coopOn) return;
    if (idx + 1 >= c.questions.length) finirCoopLigne();
    else envoyerQuestionCoop(idx + 1);
  }, 2800);
}
function totalEquipeCoop(c) { return c.joueurs.reduce((s, j) => s + j.score, 0); }
function rendreCoopLigne() {
  const M = Multi, c = JEU.coopOn;
  if (!c) return;
  const q = c.questions[c.idx];
  const monId = M.monId(), maRep = c.reponses[monId];
  const total = totalEquipeCoop(c), pct = Math.min(100, total / c.objectif * 100);
  let corps = `<div class="coop-caisse">
      <span>🤝 Caisse de l'équipe</span>
      <b>${total}/${c.objectif}</b>
    </div>
    <div class="barre-progres coop-barre"><div style="width:${pct}%;background:linear-gradient(90deg,#34d399,#22c55e)"></div></div>
    <div class="course-joueurs mt">${c.joueurs.map(j =>
      `<span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${j.score}⭐</span>`).join('')}</div>`;
  if (c.phase === 'question') {
    const repondu = maRep !== undefined;
    corps += `<div class="zone-question mt">
        <div class="q-consigne">Mission ${c.idx + 1}/${c.questions.length} • tout le monde répond !</div>
        ${q.visuel}
      </div>
      <div class="reponses">
        ${q.options.map((o, i) => `<button class="reponse ${repondu && i === maRep ? 'bonne' : ''} ${repondu ? 'inactif' : ''}"
          data-act="coop-ligne-rep" data-i="${i}" ${repondu ? 'disabled' : ''}>${o}</button>`).join('')}
      </div>
      ${repondu ? '<p class="center petit-texte mt">Réponse enregistrée, les coéquipiers jouent… 🤝</p>' : ''}`;
  } else {
    corps += `<div class="zone-question mt">
        <div class="q-consigne">Mission ${c.idx + 1} : la bonne réponse</div>${q.visuel}
        <div class="bonne-reponse-ligne">✅ ${q.options[q.answer]}</div>
      </div>`;
  }
  afficher(entetePage('🤝 Mission Coop', 'jeux') + `<div class="carte">${corps}
    <div class="emotes mt">${EMOTES.map(e => `<button class="btn" data-act="mp-emote" data-e="${e}">${e}</button>`).join('')}</div>
  </div>`);
}
function finirCoopLigne() {
  const M = Multi, c = JEU.coopOn;
  const totalEquipe = totalEquipeCoop(c);
  const reussi = totalEquipe >= c.objectif;
  c.phase = 'fin'; c.reussi = reussi; c.totalEquipe = totalEquipe;
  // Chaque appareil récompense son propre profil (ici : seulement l'hôte)
  const moi = c.joueurs.find(j => j.id === M.monId());
  finSession({ mode: 'coop', justes: moi ? moi.score : 0, total: c.questions.length, serie: 0,
    etoiles: reussi ? 3 : (moi && moi.score >= c.questions.length * .5) ? 1 : 0,
    parfait: false, opStats: { autre: moi ? moi.score : 0 } });
  M._diffuser({ t: 'coop-fin', joueurs: c.joueurs, reussi, totalEquipe, objectif: c.objectif });
  if (M.salon) M.salon.phase = 'fin';
  rendreFinCoop();
}
function rendreFinCoop() {
  const M = Multi, c = JEU.coopOn;
  afficher(entetePage(c.reussi ? '🏆 Mission réussie !' : '💪 On y est presque !', 'jeux') + `
    <div class="carte center">
      <div style="font-size:4.5rem">${c.reussi ? '🏆' : '🤝'}</div>
      <h2 class="mt">${c.reussi ? 'Bravo, quelle équipe !' : 'Belle coopération !'}</h2>
      <p class="mt">Caisse commune : <b>${c.totalEquipe} points</b> (objectif ${c.objectif})</p>
      <div class="course-joueurs mt">${c.joueurs.map(j =>
        `<span class="jeton-joueur" style="background:${j.couleur}">${j.avatar} ${echapper(j.nom)} • ${j.score}⭐</span>`).join('')}</div>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-vert" data-act="mp-encore-ligne">🔄 Refaire une mission</button>
        <button class="btn btn-grand" data-act="mp-quitter-jeu">🏠 Quitter</button>
      </div>
    </div>`);
  if (c.reussi) { pluieConfettis(180); sfx('niveau'); AudioMX.voix('victoire', true); }
  else sfx('bravo');
}
function initialiserCoopInvite() {
  const M = Multi;
  JEU.coopOn = { questions: [], joueurs: M.salon.joueurs.map((j, i) => ({ ...j, couleur: COULEURS_JOUEURS[i], score: 0 })),
    idx: 0, reponses: {}, phase: 'attente', objectif: objectifCoop(M.salon.joueurs.length), verrouille: false };
  M.surReponse = null;
  M.jeu = m => {
    const c = JEU.coopOn;
    if (!c) return;
    if (m.t === 'coop-start') {
      c.questions = m.questions; c.idx = m.idx; c.joueurs = m.joueurs; c.objectif = m.objectif;
      c.reponses = {}; c.phase = 'question'; c.verrouille = false;
      rendreCoopLigne();
    } else if (m.t === 'coop-pointage') {
      if (c.questions[m.idx]) c.questions[m.idx].answer = m.bonne;
      c.idx = m.idx; c.reponses = m.reponses; c.joueurs = m.joueurs; c.phase = 'pointage';
      rendreCoopLigne();
    } else if (m.t === 'coop-fin') {
      c.phase = 'fin'; c.joueurs = m.joueurs; c.reussi = m.reussi; c.totalEquipe = m.totalEquipe; c.objectif = m.objectif;
      const moi = m.joueurs.find(j => j.id === M.monId());
      finSession({ mode: 'coop', justes: moi ? moi.score : 0, total: NB_QUESTIONS_COOP, serie: 0,
        etoiles: m.reussi ? 3 : (moi && moi.score >= NB_QUESTIONS_COOP * .5) ? 1 : 0,
        parfait: false, opStats: { autre: moi ? moi.score : 0 } });
      if (M.salon) M.salon.phase = 'fin';
      rendreFinCoop();
    } else if (m.t === 'emote') {
      const j = c.joueurs.find(x => x.id === m.id);
      afficherEmote(j ? j.avatar : '🙂', m.e);
    }
  };
  rendreAttenteJeu('🤝 Mission Coop');
}

/* Petite animation d'emote reçue */
function afficherEmote(avatar, e) {
  const div = document.createElement('div');
  div.className = 'emote-flottante';
  div.innerHTML = `<span class="emote-avatar">${avatar}</span><span class="emote-bulle">${e}</span>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1800);
}
