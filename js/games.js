/* ============================================================
   MATH QUEST v2 — games.js
   Jeux spéciaux avec leurs propres écrans et interactions
   ============================================================ */
'use strict';

/* =================  DEVINETTE  ================= */
function ecranDevinette() {
  const maxi = profilAge().dev;
  JEU.devinette = { secret: alea(1, maxi), maxi, essais: [], saisie: '', fini: false, dernierEtat: '', message: '' };
  rendreDevinette(false);
}
function rendreDevinette(rester = true) {
  const d = JEU.devinette;
  afficher(entetePage('🎯 Devinette', 'jeux') + `
    <div class="carte center">
      <p style="font-size:2.6rem">🎯</p>
      <p>J'ai choisi un nombre entre <b>1</b> et <b>${d.maxi}</b>.<br/>Devine lequel !</p>
      <div class="afficheur" style="margin-top:14px">${d.saisie || '&nbsp;'}</div>
      <div class="devinette-zones">
        ${d.essais.slice(-10).map(e => `<div class="case-indice ${e.etat}">${e.n}<br/><span style="font-size:.75rem">${e.etat === 'touche' ? '🎉' : e.etat === 'haut' ? '↓' : '↑'}</span></div>`).join('')}
      </div>
      <div class="indice-bulle ${d.dernierEtat}">${d.message || '&nbsp;'}</div>
      <div class="pave-numerique mt">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn" data-act="dev-chiffre" data-n="${n}">${n}</button>`).join('')}
        <button class="btn btn-rouge" data-act="dev-efface"><span style="font-size:1.5rem">←</span></button>
        <button class="btn" data-act="dev-chiffre" data-n="0">0</button>
        <button class="btn btn-vert" data-act="dev-valide">OK</button>
      </div>
    </div>${navHTML('')}`, rester);
}
function devineAjout(ch) {
  const d = JEU.devinette;
  if (d.fini || d.saisie.length >= 3) return;
  d.saisie += ch; rendreDevinette();
}
function devineValide() {
  const d = JEU.devinette;
  if (d.fini || !d.saisie) return;
  const n = parseInt(d.saisie, 10);
  d.saisie = '';
  if (n < 1 || n > d.maxi) { d.message = `Entre 1 et ${d.maxi} !`; rendreDevinette(); return; }
  if (d.essais.some(e => e.n === n)) { d.message = 'Déjà essayé !'; rendreDevinette(); return; }
  if (n === d.secret) {
    d.essais.push({ n, etat: 'touche' }); d.fini = true;
    rendreDevinette();
    const essais = d.essais.length;
    const etoiles = essais <= 7 ? 3 : essais <= 12 ? 2 : 1;
    const gain = finSession({
      mode: 'devinette', justes: 1, total: 1, serie: 0, etoiles,
      parfait: false, opStats: { autre: 1 }
    });
    pluieConfettis(100); sfx('niveau');
    JEU.dernier = { type: 'mode', mode: 'devinette' };
    toutArreter();
    ecranResultats({
      emoji: '🎯', titre: 'Nombre trouvé !', justes: 1, total: 1, serie: 0,
      etoiles, pieces: gain.pieces, xp: gain.xp, badges: gain.badges,
      missions: gain.missionsTerminees, petitTexte: `${essais} essai${essais > 1 ? 's' : ''}`
    });
    return;
  }
  const etat = n > d.secret ? 'haut' : 'bas';
  d.essais.push({ n, etat });
  d.dernierEtat = etat;
  d.message = etat === 'haut' ? 'Trop haut ! Redescends ↓' : 'Trop bas ! Monte ↑';
  sfx('clic');
  rendreDevinette();
}

/* =================  ORDRE DES NOMBRES  ================= */
function ecranOrdre() {
  const p = profilAge();
  const max = joueur.age <= 6 ? 20 : Math.max(50, p.max);
  const nombres = new Set();
  while (nombres.size < 5) nombres.add(alea(1, max));
  JEU.ordre = { cible: [...nombres].sort((a, b) => a - b), melanges: melange([...nombres]), pris: [], erreurs: 0, position: 0, erreurIndex: null };
  rendreOrdre(false);
}
function rendreOrdre(rester = true) {
  const o = JEU.ordre;
  const couleurs = ['#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#3b82f6'];
  afficher(entetePage('📊 Ordre des Nombres', 'jeux') + `
    <div class="carte">
      <p class="center mb">Touche les nombres <b>du plus petit au plus grand</b> 👇</p>
      <div class="frange-triee mb">
        ${o.pris.length ? o.pris.map((n, i) => `<button class="tuile-nombre" style="background:${couleurs[i]}">${n}</button>`).join('')
          : '<span class="petit-texte">Les nombres triés apparaissent ici</span>'}
      </div>
      <div class="rangee-nombres">
        ${o.melanges.map((n, i) =>
          `<button class="tuile-nombre ${o.pris.includes(n) ? 'prise' : ''} ${o.erreurIndex === i ? 'erreur' : ''}"
            style="background:${couleurs[o.cible.indexOf(n)]}" data-act="ordre-touche" data-i="${i}">${n}</button>`).join('')}
      </div>
      <p class="petit-texte mt">Erreurs : ${o.erreurs}</p>
    </div>${navHTML('')}`, rester);
}
function ordreTouche(i) {
  const o = JEU.ordre;
  const n = o.melanges[i];
  if (o.pris.includes(n)) return;
  if (n === o.cible[o.position]) {
    o.pris.push(n); o.position++;
    sfx('bonne', o.position);
    if (o.pris.length === 5) {
      rendreOrdre();
      const etoiles = o.erreurs === 0 ? 3 : o.erreurs <= 2 ? 2 : 1;
      const gain = finSession({
        mode: 'ordre', justes: 5, total: 5, serie: 5 - o.erreurs, etoiles,
        parfait: o.erreurs === 0, opStats: { autre: 5 }
      });
      pluieConfettis(90); sfx('niveau');
      JEU.dernier = { type: 'mode', mode: 'ordre' };
      apres(() => {
        toutArreter();
        ecranResultats({ emoji: '📊', titre: 'Bien trié !', justes: 5, total: 5, serie: 0, etoiles, pieces: gain.pieces, xp: gain.xp, badges: gain.badges, missions: gain.missionsTerminees });
      }, 550);
      return;
    }
    rendreOrdre();
  } else {
    o.erreurs++;
    o.erreurIndex = i;
    sfx('faute');
    rendreOrdre();
    apres(() => { o.erreurIndex = null; rendreOrdre(); }, 450);
  }
}

/* =================  MEMORY  ================= */
function ecranMemory() {
  const paires = [];
  const utilisees = new Set();
  const mode = profilAge().mem;
  while (paires.length < 6) {
    let paire;
    if (mode === 'mul') {
      const a = alea(2, 9), b = alea(2, 9), v = a * b;
      paire = { exp: `${a} × ${b}`, val: v };
    } else if (mode === 'div') {
      const diviseur = alea(2, 9), q = alea(2, 10), total = diviseur * q;
      paire = { exp: `${total} ÷ ${diviseur}`, val: q };
    } else {
      const a = alea(1, 10), b = alea(1, 10);
      paire = { exp: `${a} + ${b}`, val: a + b };
    }
    if (utilisees.has(paire.val)) continue;
    utilisees.add(paire.val);
    paires.push(paire);
  }
  const cartes = [];
  paires.forEach((p, idx) => {
    cartes.push({ paire: idx, texte: p.exp });
    cartes.push({ paire: idx, texte: String(p.val) });
  });
  JEU.memory = { cartes: melange(cartes), retournees: [], trouvees: [], coups: 0, bloque: false };
  rendreMemory(false);
}
function rendreMemory(rester = true) {
  const m = JEU.memory;
  afficher(entetePage('🃏 Memory Math', 'jeux') + `
    <div class="carte">
      <p class="center mb">Associe chaque <b>opération</b> à son <b>résultat</b> ! Coups : <b>${m.coups}</b></p>
      <div class="plateau-memory">
        ${m.cartes.map((c, i) => `
          <button class="carte-memory ${m.retournees.includes(i) || m.trouvees.includes(i) ? 'retournee' : ''} ${m.trouvees.includes(i) ? 'trouvee' : ''}"
            data-act="memory-touche" data-i="${i}">
            <span class="cm-interne">
              <span class="cm-face cm-dos">❓</span>
              <span class="cm-face cm-avant">${c.texte}</span>
            </span>
          </button>`).join('')}
      </div>
    </div>${navHTML('')}`, rester);
}
function memoryTouche(i) {
  const m = JEU.memory;
  if (m.bloque || m.retournees.includes(i) || m.trouvees.includes(i)) return;
  sfx('clic');
  m.retournees.push(i);
  if (m.retournees.length === 2) {
    m.coups++;
    const [x, y] = m.retournees;
    rendreMemory();
    if (m.cartes[x].paire === m.cartes[y].paire && m.cartes[x].texte !== m.cartes[y].texte) {
      m.bloque = true;
      apres(() => {
        m.trouvees.push(x, y); m.retournees = []; m.bloque = false;
        sfx('bonne');
        rendreMemory();
        if (m.trouvees.length === 12) finirMemory(m.coups);
      }, 420);
    } else {
      m.bloque = true;
      apres(() => { m.retournees = []; m.bloque = false; sfx('faute'); rendreMemory(); }, 850);
    }
  } else rendreMemory();
}
function finirMemory(coups) {
  toutArreter();
  const etoiles = coups <= 9 ? 3 : coups <= 15 ? 2 : 1;
  const recordBattu = batRecord('memory', coups, false);
  const gain = finSession({
    mode: 'memory', justes: 6, total: 6, serie: 0, etoiles,
    parfait: coups <= 9, opStats: { add: 6 },
    recordCle: 'memory', recordValeur: coups, recordPlusHaut: false
  });
  pluieConfettis(110); sfx('niveau');
  JEU.dernier = { type: 'mode', mode: 'memory' };
  ecranResultats({
    emoji: '🃏', titre: 'Toutes les paires !', justes: 6, total: 6, serie: 0,
    etoiles, pieces: gain.pieces, xp: gain.xp, badges: gain.badges,
    missions: gain.missionsTerminees,
    petitTexte: recordBattu ? `🏆 Nouveau record : ${coups} coups !` : `Réussi en ${coups} coups`
  });
}

/* =================  COLORIAGE MAGIQUE  ================= */
let coloriageActif = 0, peintureChoisie = '#f43f5e';
const cellulesPeintes = {};
function ecranColoriage() { rendreColoriage(false); }
function rendreColoriage(rester = true) {
  const modele = COLORIAGES[coloriageActif];
  const lignes = modele.modele;
  afficher(entetePage('🎨 Coloriage Magique', 'jeux') + `
    <div class="carte">
      <div class="modele-mini">
        ${COLORIAGES.map((c, i) => `<button class="modele-btn ${i === coloriageActif ? 'actif' : ''}" data-act="color-modele" data-i="${i}">${c.emoji} ${c.nom}</button>`).join('')}
      </div>
      <p class="center petit-texte mb">Toutes les cases clair doivent être peintes avec <b>la bonne couleur</b>… ou celle que tu veux ! 🎨</p>
      <div class="grille-coloriage" style="grid-template-columns:repeat(${lignes[0].length},1fr)">
        ${lignes.flatMap((ligne, y) => [...ligne].map((ch, x) => {
          const cle = `${coloriageActif}-${y}-${x}`;
          const peinture = cellulesPeintes[cle];
          const aPeindre = ch !== '.';
          return `<button class="cellule" data-act="color-cell" data-cle="${cle}"
            style="background:${peinture || (aPeindre ? '#f1efff' : '#fff')};${aPeindre ? 'box-shadow:inset 0 0 0 1px #ddd6fe' : ''}"></button>`;
        })).join('')}
      </div>
      <div class="palette">
        ${PALETTE.map(c => `<button class="peinture ${c === peintureChoisie ? 'active' : ''}" style="background:${c};${c === '#f8fafc' ? 'box-shadow:inset 0 0 0 2px #cbd5e1,var(--ombre-petite)' : ''}" data-act="color-couleur" data-c="${c}"></button>`).join('')}
        <button class="peinture ${peintureChoisie === 'GOMME' ? 'active' : ''}" style="background:repeating-linear-gradient(45deg,#fff 0 6px,#fca5a5 6px 10px)" data-act="color-efface">🧽</button>
      </div>
      <button class="btn btn-rouge btn-grand" data-act="color-reset">🗑️ Tout effacer</button>
    </div>${navHTML('')}`, rester);
}
function peintCellule(cle) {
  if (peintureChoisie === 'GOMME') delete cellulesPeintes[cle];
  else cellulesPeintes[cle] = peintureChoisie;
  sfx('clic');
  // Mise à jour de la SEULE case touchée (aucun rechargement de l'écran,
  // donc aucun saut/flash sur mobile)
  const [, cy, cx] = cle.split('-').map(Number);
  const modele = COLORIAGES[coloriageActif];
  const caseEl = document.querySelector(`.cellule[data-cle="${cle}"]`);
  if (caseEl) {
    if (peintureChoisie === 'GOMME') {
      const aPeindre = modele.modele[cy][cx] !== '.';
      caseEl.style.background = '#fff';
      if (aPeindre) caseEl.style.boxShadow = 'inset 0 0 0 1px #ddd6fe';
      else caseEl.style.boxShadow = '';
    } else {
      caseEl.style.background = peintureChoisie;
      caseEl.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.4)';
    }
  }
  let attendues = 0, peintes = 0;
  modele.modele.forEach((ligne, y) => [...ligne].forEach((ch, x) => {
    if (ch !== '.') { attendues++; if (cellulesPeintes[`${coloriageActif}-${y}-${x}`]) peintes++; }
  }));
  if (attendues === peintes && !joueur.coloriages.includes(modele.id)) {
    joueur.coloriages.push(modele.id);
    const gain = finSession({
      mode: 'coloriage', justes: 1, total: 1, serie: 0, etoiles: null,
      parfait: false, opStats: { autre: 1 }, bonusPieces: 20
    });
    pluieConfettis(120); sfx('niveau');
    AudioMX.voix('bravo', true);
    apres(() => dire(`🎉 ${modele.emoji} ${modele.nom} terminé ! +${gain.pieces} pièces`), 200);
  }
}

/* =================  FUSÉE  ================= */
function ecranFusee() {
  JEU.fusee = { restant: 60, score: 0, fini: false, verrouille: false, question: null, opStats: {}, dernierTick: null };
  JEU.dernier = { type: 'mode', mode: 'fusee' };
  nouvelleQuestionFusee();
  rendreFusee(false);
  JEU.fusee.chrono = toutesLes(() => {
    const f = JEU.fusee;
    f.restant -= .1;
    const t = $('#fusee-chrono'), barre = $('#fusee-barre'), fus = $('#fusee-emoji');
    const sec = Math.ceil(f.restant);
    if (t) { t.textContent = sec; t.classList.toggle('danger', f.restant <= 10); }
    if (barre) barre.style.width = `${f.restant / 60 * 100}%`;
    if (fus) fus.style.bottom = `${8 + Math.min(100, f.score * 6)}px`;
    if (sec <= 5 && sec >= 1 && sec !== f.dernierTick) { f.dernierTick = sec; sfx('tick'); }
    if (f.restant <= 0) finirFusee();
  }, 100);
}
function nouvelleQuestionFusee() {
  const q = genereCalcul('mixed');
  const bonTexte = q.options[q.answer];
  const distracteurs = melange(q.options.filter((_, i) => i !== q.answer)).slice(0, 2);
  q.options = melange([bonTexte, ...distracteurs]);
  q.answer = q.options.indexOf(bonTexte);
  JEU.fusee.question = q;
}
function rendreFusee(rester = true) {
  const f = JEU.fusee, q = f.question;
  afficher(`
    ${entetePage('🚀 Fusée', 'jeux')}
    <div class="carte">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="gros-chrono" id="fusee-chrono">60</div>
        <div class="qh-score" style="font-size:1.25rem">⭐ ${f.score}</div>
      </div>
      <div class="barre-temps mt"><div id="fusee-barre" style="width:100%"></div></div>
      <div class="fusee-scene">
        <div class="fusee-etoiles">${[...Array(6)].map((_, i) => `<span style="left:${10 + i * 16}%;animation-delay:${i * .4}s">⭐</span>`).join('')}</div>
        <div class="fusee-emoji" id="fusee-emoji">🚀</div>
      </div>
      <div class="zone-question" style="box-shadow:none;background:#f4f2ff">${q.visuel}</div>
      <div class="reponses" style="grid-template-columns:repeat(3,1fr)">
        ${q.options.map((o, i) => `<button class="reponse" style="font-size:1.4rem;min-height:62px;padding:12px" data-act="fusee-rep" data-i="${i}">${o}</button>`).join('')}
      </div>
    </div>`, rester);
}
function fuseeRepond(i) {
  const f = JEU.fusee;
  if (f.verrouille || f.fini) return;
  const q = f.question;
  f.verrouille = true;
  const boutons = $$('.reponse');
  boutons[q.answer].classList.add('bonne');
  if (i === q.answer) {
    f.score++;
    f.opStats[q.op || 'autre'] = (f.opStats[q.op || 'autre'] || 0) + 1;
    sfx('bonne', f.score);
    if (f.score % 10 === 0) AudioMX.voix('combo', true);
    else AudioMX.voix('bonne');
    if (boutons[i]) flottantSurElement(boutons[i], '+1 ⭐', '#16a34a');
  } else {
    boutons[i].classList.add('mauvaise'); sfx('faute');
  }
  apres(() => {
    if (f.fini) return;
    nouvelleQuestionFusee(); f.verrouille = false; rendreFusee();
  }, 320);
}
function finirFusee() {
  const f = JEU.fusee;
  if (f.fini) return;
  f.fini = true;
  toutArreter();
  const etoiles = f.score >= 15 ? 3 : f.score >= 10 ? 2 : f.score >= 5 ? 1 : 0;
  const recordBattu = batRecord('fusee', f.score, true);
  const gain = finSession({
    mode: 'fusee', justes: f.score, total: Math.max(f.score, 1), serie: f.score,
    etoiles, parfait: f.score >= 15, opStats: f.opStats,
    recordCle: 'fusee', recordValeur: f.score
  });
  if (f.score >= 10) { pluieConfettis(110); sfx('niveau'); }
  ecranResultats({
    emoji: f.score >= 10 ? '🚀' : '🛸', titre: `${f.score} bonnes réponses !`,
    justes: f.score, total: f.score, serie: f.score, etoiles,
    pieces: gain.pieces, xp: gain.xp, badges: gain.badges, missions: gain.missionsTerminees,
    petitTexte: recordBattu ? '🏆 Nouveau record !' : `Record : ${joueur.records.fusee || 0}`
  });
}

/* =================  TAPE-TAUPE (NOUVEAU)  ================= */
function ecranTaupe() {
  const p = profilAge();
  JEU.taupe = { restant: 30, score: 0, serie: 0, cible: null, trous: Array(9).fill(null), fini: false, opStats: {}, voleeMs: p.taupeMs, dernierTick: null };
  JEU.dernier = { type: 'mode', mode: 'taupe' };
  nouvelleVoleeTaupe();
  rendreTaupe(false);
  // changement de volée automatique (plus rapide avec l'âge/niveau)
  JEU.taupe.voleeTimer = toutesLes(() => {
    const t = JEU.taupe;
    if (t.fini) return;
    nouvelleVoleeTaupe(); rendreTaupe();
  }, p.taupeMs);
  JEU.taupe.chrono = toutesLes(() => {
    const t = JEU.taupe;
    t.restant -= .1;
    const el = $('#taupe-chrono'), barre = $('#taupe-barre');
    const sec = Math.ceil(t.restant);
    if (el) { el.textContent = sec; el.classList.toggle('danger', t.restant <= 10); }
    if (barre) barre.style.width = `${t.restant / 30 * 100}%`;
    if (sec <= 5 && sec >= 1 && sec !== t.dernierTick) { t.dernierTick = sec; sfx('tick'); }
    if (t.restant <= 0) finirTaupe();
  }, 100);
}
function nouvelleVoleeTaupe() {
  const t = JEU.taupe;
  const niveauMax = profilAge().taupe;
  const trous = Array(9).fill(null);
  const positions = melange([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, alea(3, 4));
  // 1 bonne taupe dont la valeur devient la cible
  const bonneExpr = construireExpression(niveauMax);
  t.cible = bonneExpr.valeur;
  trous[positions[0]] = bonneExpr;
  positions.slice(1).forEach(p => {
    let e = construireExpression(niveauMax), garde = 0;
    while (e.valeur === t.cible && garde++ < 12) e = construireExpression(niveauMax);
    trous[p] = e;
  });
  t.trous = trous;
}
function rendreTaupe(rester = true) {
  const t = JEU.taupe;
  afficher(`${entetePage('🔨 Tape-Taupe', 'jeux')}
    <div class="carte">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="gros-chrono" id="taupe-chrono">30</div>
        <div class="qh-score" style="font-size:1.25rem">🔨 ${t.score}</div>
      </div>
      <div class="barre-temps mt"><div id="taupe-barre" style="width:100%"></div></div>
      <div class="cible-arcade">Tape la taupe qui fait <span class="num-cible">${t.cible}</span></div>
      <div class="plateau-taupe">
        ${t.trous.map((e, i) => `
          <button class="trou ${e ? 'active' : ''}" data-act="taupe-tap" data-i="${i}">
            ${e ? `<span class="taupe"><span class="taupe-bulle">${e.texte}</span>🐹</span>` : ''}
          </button>`).join('')}
      </div>
      <p class="petit-texte mt">🔥 Série : ${t.serie}</p>
    </div>`, rester);
}
function taupeTape(i) {
  const t = JEU.taupe;
  if (t.fini) return;
  const e = t.trous[i];
  const trou = $$('.trou')[i];
  if (!e) return;
  if (e.valeur === t.cible) {
    t.score++; t.serie++;
    t.opStats[e.op || 'autre'] = (t.opStats[e.op || 'autre'] || 0) + 1;
    sfx('taupe', t.serie);
    if (t.serie % 5 === 0) AudioMX.voix('combo', true);
    else AudioMX.voix('bonne');
    if (trou) {
      trou.classList.add('tap-ok');
      const r = trou.getBoundingClientRect();
      explosion(r.left + r.width / 2, r.top + 10, 12, '#22c55e');
    }
    apres(() => { if (!t.fini) { nouvelleVoleeTaupe(); rendreTaupe(); } }, 220);
  } else {
    t.serie = 0; t.score = Math.max(0, t.score - 1);
    sfx('faute');
    if (trou) { trou.classList.add('tap-nok'); setTimeout(() => trou.classList.remove('tap-nok'), 300); }
    rendreTaupe();
  }
}
function finirTaupe() {
  const t = JEU.taupe;
  if (t.fini) return;
  t.fini = true;
  toutArreter();
  const etoiles = t.score >= 20 ? 3 : t.score >= 14 ? 2 : t.score >= 8 ? 1 : 0;
  const recordBattu = batRecord('taupe', t.score, true);
  const gain = finSession({
    mode: 'taupe', justes: t.score, total: Math.max(t.score, 1), serie: t.serie,
    etoiles, parfait: t.score >= 20, opStats: t.opStats,
    recordCle: 'taupe', recordValeur: t.score
  });
  if (t.score >= 14) { pluieConfettis(110); sfx('niveau'); }
  ecranResultats({
    emoji: '🔨', titre: `${t.score} taupes tapées !`,
    justes: t.score, total: t.score, serie: t.serie, etoiles,
    pieces: gain.pieces, xp: gain.xp, badges: gain.badges, missions: gain.missionsTerminees,
    petitTexte: recordBattu ? '🏆 Nouveau record !' : `Record : ${joueur.records.taupe || 0}`
  });
}

/* =================  DUEL / MULTIJOUEUR  ================= */
let nbJoueursFete = 2;
function ecranDuel(n) {
  if (n) nbJoueursFete = n;
  rendreDuel();
}
function rendreDuel() {
  afficher(entetePage('⚔️ Duel entre amis', 'jeux') + `
    <div class="carte">
      <p class="center mb">Combien de joueurs ?</p>
      <div class="deux mb plusieurs-boutons" style="display:grid;grid-template-columns:repeat(3,1fr)">
        ${[2, 3, 4].map(n => `<button class="btn ${n === nbJoueursFete ? 'btn-principal' : ''}" data-act="fete-nb" data-n="${n}">${n}</button>`).join('')}
      </div>
      ${Array.from({ length: nbJoueursFete }, (_, i) => `
        <div class="porte-avatar">
          <select data-joueur="${i}">
            ${AVATARS.map(a => `<option ${a === AVATARS[i % AVATARS.length] ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
          <input maxlength="14" data-nom="${i}" value="Joueur ${i + 1}"/>
        </div>`).join('')}
      <p class="center mt mb">Difficulté :</p>
      <div class="deux mb" id="diff-boutons" style="display:grid;grid-template-columns:repeat(3,1fr)">
        <button class="btn btn-vert" data-act="fete-diff" data-d="facile">🟢 Facile</button>
        <button class="btn btn-orange" data-act="fete-diff" data-d="moyen">🟡 Moyen</button>
        <button class="btn btn-rouge" data-act="fete-diff" data-d="difficile">🔴 Difficile</button>
      </div>
      <button class="btn btn-grand btn-principal" data-act="fete-commencer">⚔️ C'est parti !</button>
    </div>${navHTML('')}`);
  JEU.feteDiff = JEU.feteDiff || 'facile';
  marqueDiff();
}
function marqueDiff() {
  $$('#diff-boutons button').forEach(b => b.style.opacity = b.dataset.d === JEU.feteDiff ? '1' : '.55');
}
function commencerFete() {
  const joueurs = Array.from({ length: nbJoueursFete }, (_, i) => {
    const sel = $(`select[data-joueur="${i}"]`), inp = $(`input[data-nom="${i}"]`);
    return {
      avatar: sel ? sel.value : AVATARS[i],
      nom: (inp && inp.value.trim() ? inp.value : `Joueur ${i + 1}`).slice(0, 14)
    };
  });
  JEU.fete = { joueurs, questions: genereQuestionsDuel(JEU.feteDiff), idx: 0, scores: [] };
  JEU.dernier = { type: 'fete' };
  porteFete();
}
function relancerFete() {
  if (!JEU.fete) return rendreDuel();
  JEU.fete.questions = genereQuestionsDuel(JEU.feteDiff);
  JEU.fete.idx = 0; JEU.fete.scores = [];
  porteFete();
}
function porteFete() {
  const f = JEU.fete, j = f.joueurs[f.idx];
  afficher(`<div class="carte ecran-passe" style="margin-top:30px">
    <div class="ep-avatar">${j.avatar}</div>
    <h2 class="mt">Au tour de ${echapper(j.nom)} !</h2>
    <p class="mt">Passe l'appareil à <b>${echapper(j.nom)}</b>,<br/>et appuie quand tu es prêt(e).</p>
    <p class="petit-texte mt">Joueur ${f.idx + 1} / ${f.joueurs.length} • 5 questions</p>
    <button class="btn btn-grand btn-principal mt" data-act="fete-pret">Je suis prêt(e) ! 👍</button>
  </div>`);
}
function jouerTourFete() {
  const f = JEU.fete;
  moteurQuiz({
    titre: `${f.joueurs[f.idx].avatar} ${f.joueurs[f.idx].nom}`,
    questions: f.questions,
    apresFin: stats => {
      f.scores[f.idx] = stats.justes;
      f.idx++;
      if (f.idx < f.joueurs.length) apres(porteFete, 300);
      else podiumFete();
    }
  });
}
function podiumFete() {
  const f = JEU.fete;
  const resultat = f.joueurs.map((j, i) => ({ ...j, score: f.scores[i] || 0 }))
    .sort((a, b) => b.score - a.score);
  const medailles = ['🥇', '🥈', '🥉', '🎖️'];
  afficher(entetePage('🏆 Podium', 'accueil') + `
    <div class="carte">
      <div class="podium-final">
        ${resultat.map((j, i) => `
          <div class="ligne-podium ${i === 0 ? 'or1' : i === 1 ? 'or2' : i === 2 ? 'or3' : ''}">
            <span style="font-size:1.5rem">${medailles[i] || '🎖️'}</span>
            <span style="font-size:1.7rem">${j.avatar}</span>
            <span>${echapper(j.nom)}</span>
            <span class="lp-score">${j.score} ⭐</span>
          </div>`).join('')}
      </div>
      ${resultat[0].score === (resultat[1] && resultat[1].score) ? '<p class="center mt">🤝 Égalité ! Bravo à tous !</p>'
        : `<p class="center mt">🎉 Bravo ${echapper(resultat[0].nom)} !</p>`}
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-principal" data-act="refaire">🔄 Revanche !</button>
        <button class="btn btn-grand" data-act="nav" data-ecran="accueil">🏠 Accueil</button>
      </div>
    </div>`);
  pluieConfettis(140); sfx('niveau');
}

/* =================  PING-PONG MENTAL (v3.0)  ================= */
function ecranPingPong() {
  toutArreter();
  JEU.ping = {
    vies: 3, score: 0, serie: 0, question: null, verrouille: false, encaisse: false,
    fini: false, delaiMs: 12000, restant: 12000, opStats: {}, dernierTick: null, timer: null
  };
  JEU.dernier = { type: 'mode', mode: 'pingpong' };
  nouvelleQuestionPing();
  rendrePing(false);
  JEU.ping.timer = toutesLes(() => {
    const p = JEU.ping;
    if (!p || p.fini || p.verrouille) return;
    p.restant -= 100;
    const barre = $('#ping-barre'), chrono = $('#ping-chrono');
    if (barre) barre.style.width = Math.max(0, p.restant / p.delaiMs * 100) + '%';
    if (chrono) chrono.textContent = Math.ceil(p.restant / 1000);
    const sec = Math.ceil(p.restant / 1000);
    if (sec <= 3 && sec >= 1 && sec !== p.dernierTick) { p.dernierTick = sec; sfx('tick'); }
    if (p.restant <= 0) pingRate();
  }, 100);
}
function nouvelleQuestionPing() {
  const p = JEU.ping;
  const q = genereCalcul('mixed');
  const bonTexte = q.options[q.answer];
  const distracteurs = melange(q.options.filter((_, i) => i !== q.answer)).slice(0, 2);
  q.options = melange([bonTexte, ...distracteurs]);
  q.answer = q.options.indexOf(bonTexte);
  p.question = q;
  p.delaiMs = Math.max(3800, 12000 - p.score * 420);
  p.restant = p.delaiMs;
  p.dernierTick = null;
}
function rendrePing(rester = true) {
  const p = JEU.ping, q = p.question;
  afficher(`${entetePage('🏓 Ping-Pong Mental', 'jeux')}
    <div class="carte">
      <div class="ping-haut">
        <div class="ping-coeurs">${'❤️'.repeat(p.vies)}${'🤍'.repeat(Math.max(0, 3 - p.vies))}</div>
        <div class="qh-score" style="font-size:1.2rem">🏓 <b>${p.score}</b> échanges</div>
      </div>
      <div class="ping-terrain">
        <div class="ping-joueur ping-adversaire" id="ping-adv">👾</div>
        <div class="ping-balle">${q.visuel.replace('q-calcul', 'q-calcul ping-calcul')}</div>
        <div class="ping-joueur ping-moi">🧒</div>
      </div>
      <div class="barre-temps mt"><div id="ping-barre" style="width:100%"></div></div>
      <div class="reponses mt" style="grid-template-columns:repeat(3,1fr)">
        ${q.options.map((o, i) => `<button class="reponse" style="font-size:1.4rem;min-height:60px;padding:10px" data-act="ping-rep" data-i="${i}">${o}</button>`).join('')}
      </div>
      <p class="petit-texte mt">🔥 Série : ${p.serie} • plus tu gagnes, plus la balle va vite !</p>
    </div>`, rester);
}
function pingRepond(i) {
  const p = JEU.ping;
  if (!p || p.fini || p.verrouille) return;
  const q = p.question;
  const boutons = $$('.reponse');
  boutons[q.answer].classList.add('bonne');
  if (i === q.answer) {
    p.verrouille = true;
    p.score++; p.serie++;
    p.opStats[q.op || 'autre'] = (p.opStats[q.op || 'autre'] || 0) + 1;
    sfx('bonne', p.score);
    if (p.score % 5 === 0) AudioMX.voix('combo', true); else AudioMX.voix('bonne');
    if (boutons[i]) flottantSurElement(boutons[i], '+1 🏓', '#16a34a');
    apres(() => {
      if (p.fini) return;
      nouvelleQuestionPing(); p.verrouille = false; rendrePing();
    }, 280);
  } else {
    if (boutons[i]) boutons[i].classList.add('mauvaise');
    pingRate();
  }
}
function pingRate() {
  const p = JEU.ping;
  if (!p || p.fini || p.encaisse) return;
  p.encaisse = true; p.verrouille = true;
  p.vies--; p.serie = 0;
  sfx('faute'); AudioMX.voix('faute');
  const adv = $('#ping-adv');
  if (adv) adv.classList.add('adv-marque');
  apres(() => {
    if (p.vies <= 0) { finirPing(); return; }
    nouvelleQuestionPing(); p.verrouille = false; p.encaisse = false; rendrePing();
  }, 750);
}
function finirPing() {
  const p = JEU.ping;
  if (p.fini) return;
  p.fini = true;
  toutArreter();
  const etoiles = p.score >= 15 ? 3 : p.score >= 10 ? 2 : p.score >= 5 ? 1 : 0;
  const recordBattu = batRecord('pingpong', p.score, true);
  const gain = finSession({
    mode: 'pingpong', justes: p.score, total: Math.max(1, p.score), serie: p.serie,
    etoiles, parfait: p.score >= 15, opStats: p.opStats,
    recordCle: 'pingpong', recordValeur: p.score
  });
  if (p.score >= 10) { pluieConfettis(110); sfx('niveau'); }
  ecranResultats({
    emoji: p.score >= 10 ? '🏓' : '🪶', titre: `${p.score} échanges gagnés !`,
    justes: p.score, total: Math.max(1, p.score), serie: p.serie, etoiles,
    pieces: gain.pieces, xp: gain.xp, badges: gain.badges, missions: gain.missionsTerminees,
    petitTexte: recordBattu ? '🏆 Nouveau record !' : `Record : ${joueur.records.pingpong || 0}`
  });
}

/* =================  SUDOKU DES NOMBRES (v3.0)  ================= */
function genererGrilleSudoku(n) {
  let base;
  if (n === 4) base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 3, 4, 1], [4, 1, 2, 3]];
  else base = [[1, 2, 3], [2, 3, 1], [3, 1, 2]];
  // Permutation des symboles
  const symboles = melange(Array.from({ length: n }, (_, i) => i + 1));
  let g = base.map(l => l.map(v => symboles[v - 1]));
  const transpose = m => m[0].map((_, j) => m.map(r => r[j]));
  if (n === 4) {
    const ech = (a, b) => { [g[a], g[b]] = [g[b], g[a]]; };
    if (Math.random() < .5) ech(0, 1);
    if (Math.random() < .5) ech(2, 3);
    if (Math.random() < .5) { ech(0, 2); ech(1, 3); }
    g = transpose(g);
    const echC = (a, b) => { [g[a], g[b]] = [g[b], g[a]]; };
    if (Math.random() < .5) echC(0, 1);
    if (Math.random() < .5) echC(2, 3);
    if (Math.random() < .5) { echC(0, 2); echC(1, 3); }
    g = transpose(g);
  } else {
    g = melange(g);
    g = transpose(g);
    g = melange(g);
    g = transpose(g);
  }
  return g;
}
function ecranSudoku() {
  const taille = (joueur && joueur.age <= 6) ? 3 : 4;
  const solution = genererGrilleSudoku(taille);
  const grille = solution.map(l => l.slice());
  const nbTrous = taille === 3 ? 4 : 9;
  const trous = melange(Array.from({ length: taille * taille }, (_, i) => i)).slice(0, nbTrous);
  trous.forEach(k => { grille[Math.floor(k / taille)][k % taille] = 0; });
  JEU.sudoku = { taille, solution, grille, fixes: new Set(), justes: new Set(), selection: null, erreurs: 0, fini: false };
  for (let k = 0; k < taille * taille; k++) if (!trous.includes(k)) JEU.sudoku.fixes.add(k);
  JEU.dernier = { type: 'mode', mode: 'sudoku' };
  rendreSudoku(false);
}
function rendreSudoku(rester = true) {
  const s = JEU.sudoku;
  const n = s.taille;
  const bloc = n === 4 ? 2 : n;
  let cases = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const k = r * n + c, v = s.grille[r][c];
    const fixe = s.fixes.has(k), juste = s.justes.has(k);
    const classeBase = fixe || juste ? 'fixe' : 'vide';
    const bord = `${c % bloc === 0 ? 'border-left-width:3px;' : ''}${r % bloc === 0 ? 'border-top-width:3px;' : ''}${c === n - 1 ? 'border-right-width:3px;' : ''}${r === n - 1 ? 'border-bottom-width:3px;' : ''}`;
    cases += `<button class="cell-sud ${classeBase}" style="${bord}" data-act="sud-cell" data-k="${k}">${v || ''}</button>`;
  }
  afficher(`${entetePage('🧩 Sudoku des Nombres', 'jeux')}
    <div class="carte">
      <p class="center mb">Chaque ligne et chaque colonne doit contenir <b>tous les nombres de 1 à ${n}</b> !</p>
      <div class="grille-sudoku" style="grid-template-columns:repeat(${n},1fr)">${cases}</div>
      <p class="petit-texte center mt">Erreurs : <b id="sud-erreurs">${s.erreurs}</b> • touche une case claire puis un nombre 👇</p>
      <div class="pave-numerique mt" style="max-width:340px;margin:0 auto">
        ${Array.from({ length: n }, (_, i) => `<button class="btn btn-principal" style="font-size:1.4rem" data-act="sud-chiffre" data-n="${i + 1}">${i + 1}</button>`).join('')}
        <button class="btn btn-rouge" data-act="sud-efface"><span style="font-size:1.5rem">←</span></button>
      </div>
    </div>${navHTML('')}`, rester);
}
/* Mise à jour UNIQUEMENT visuelle d'une case (pas de reconstruction d'écran) */
function sudCaseEl(k) { return document.querySelector(`.cell-sud[data-k="${k}"]`); }
function sudChoisit(k) {
  const s = JEU.sudoku;
  if (!s || s.fini || s.fixes.has(k) || s.justes.has(k)) return;
  // Déplace la surbrillance sans recharger la grille
  document.querySelectorAll('.cell-sud.selection').forEach(e => e.classList.remove('selection'));
  s.selection = k;
  sfx('clic');
  const el = sudCaseEl(k);
  if (el) el.classList.add('selection');
}
function sudChiffre(n) {
  const s = JEU.sudoku;
  if (!s || s.fini) return;
  if (s.selection === null) { dire('Touche d\'abord une case claire !'); sfx('ferme'); return; }
  const k = s.selection, r = Math.floor(k / s.taille), c = k % s.taille;
  const el = sudCaseEl(k);
  if (n === s.solution[r][c]) {
    s.grille[r][c] = n; s.justes.add(k); s.selection = null;
    sfx('bonne'); AudioMX.voix('bonne');
    if (el) {
      el.textContent = n;
      el.classList.remove('vide', 'selection');
      el.classList.add('fixe');
    }
    if (s.grille.every((ligne, i) => ligne.every((v, j) => v === s.solution[i][j]))) {
      apres(finirSudoku, 350);
    }
  } else {
    s.erreurs++;
    const compteur = $('#sud-erreurs'); if (compteur) compteur.textContent = s.erreurs;
    sfx('faute'); AudioMX.voix('faute');
    if (el) {
      el.classList.add('fausse');
      apres(() => el.classList.remove('fausse'), 450);
    }
  }
}
function sudEfface() {
  const s = JEU.sudoku;
  if (!s || s.fini || s.selection === null) return;
  const k = s.selection;
  s.grille[Math.floor(k / s.taille)][k % s.taille] = 0;
  s.selection = null;
  const el = sudCaseEl(k);
  if (el) { el.textContent = ''; el.classList.remove('selection'); }
}
function finirSudoku() {
  const s = JEU.sudoku;
  if (s.fini) return;
  s.fini = true;
  toutArreter();
  const etoiles = s.erreurs === 0 ? 3 : s.erreurs <= 2 ? 2 : 1;
  const gain = finSession({
    mode: 'sudoku', justes: 1, total: 1, serie: 0, etoiles,
    parfait: s.erreurs === 0, opStats: { autre: 1 }
  });
  pluieConfettis(120); sfx('niveau');
  ecranResultats({
    emoji: '🧩', titre: 'Grille résolue !', justes: 1, total: 1, serie: 0,
    etoiles, pieces: gain.pieces, xp: gain.xp, badges: gain.badges,
    missions: gain.missionsTerminees,
    petitTexte: s.erreurs === 0 ? 'Sans une seule erreur ! 🌟' : `${s.erreurs} erreur(s)`
  });
}
