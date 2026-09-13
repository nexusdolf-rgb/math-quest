/* ============================================================
   MATH QUEST v2 — games.js
   Jeux spéciaux avec leurs propres écrans et interactions
   ============================================================ */
'use strict';

/* =================  DEVINETTE  ================= */
function ecranDevinette() {
  const maxi = joueur.age <= 6 ? 50 : 100;
  JEU.devinette = { secret: alea(1, maxi), maxi, essais: [], saisie: '', fini: false, dernierEtat: '', message: '' };
  rendreDevinette();
}
function rendreDevinette() {
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
        <button class="btn btn-rouge" data-act="dev-efface">⌫</button>
        <button class="btn" data-act="dev-chiffre" data-n="0">0</button>
        <button class="btn btn-vert" data-act="dev-valide">OK</button>
      </div>
    </div>${navHTML('')}`);
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
  const max = joueur.age <= 6 ? 20 : 50;
  const nombres = new Set();
  while (nombres.size < 5) nombres.add(alea(1, max));
  JEU.ordre = { cible: [...nombres].sort((a, b) => a - b), melanges: melange([...nombres]), pris: [], erreurs: 0, position: 0, erreurIndex: null };
  rendreOrdre();
}
function rendreOrdre() {
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
    </div>${navHTML('')}`);
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
  while (paires.length < 6) {
    const a = alea(1, 10), b = alea(1, 10), v = a + b;
    if (utilisees.has(v)) continue;
    utilisees.add(v);
    paires.push({ exp: `${a} + ${b}`, val: v });
  }
  const cartes = [];
  paires.forEach((p, idx) => {
    cartes.push({ paire: idx, texte: p.exp });
    cartes.push({ paire: idx, texte: String(p.val) });
  });
  JEU.memory = { cartes: melange(cartes), retournees: [], trouvees: [], coups: 0, bloque: false };
  rendreMemory();
}
function rendreMemory() {
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
    </div>${navHTML('')}`);
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
function ecranColoriage() { rendreColoriage(); }
function rendreColoriage() {
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
    </div>${navHTML('')}`);
}
function peintCellule(cle) {
  if (peintureChoisie === 'GOMME') delete cellulesPeintes[cle];
  else cellulesPeintes[cle] = peintureChoisie;
  sfx('clic');
  rendreColoriage();
  const modele = COLORIAGES[coloriageActif];
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
    apres(() => dire(`🎉 ${modele.emoji} ${modele.nom} terminé ! +${gain.pieces} pièces`), 200);
  }
}

/* =================  FUSÉE  ================= */
function ecranFusee() {
  JEU.fusee = { restant: 60, score: 0, fini: false, verrouille: false, question: null, opStats: {} };
  JEU.dernier = { type: 'mode', mode: 'fusee' };
  nouvelleQuestionFusee();
  rendreFusee();
  JEU.fusee.chrono = toutesLes(() => {
    const f = JEU.fusee;
    f.restant -= .1;
    const t = $('#fusee-chrono'), barre = $('#fusee-barre'), fus = $('#fusee-emoji');
    if (t) { t.textContent = Math.ceil(f.restant); t.classList.toggle('danger', f.restant <= 10); }
    if (barre) barre.style.width = `${f.restant / 60 * 100}%`;
    if (fus) fus.style.bottom = `${8 + Math.min(100, f.score * 6)}px`;
    if (f.restant <= 0) finirFusee();
  }, 100);
}
function nouvelleQuestionFusee() {
  const age = joueur.age;
  const q = genereCalcul('mixed', 1, age <= 6 ? 10 : age <= 8 ? 20 : 30);
  const bonTexte = q.options[q.answer];
  const distracteurs = melange(q.options.filter((_, i) => i !== q.answer)).slice(0, 2);
  q.options = melange([bonTexte, ...distracteurs]);
  q.answer = q.options.indexOf(bonTexte);
  JEU.fusee.question = q;
}
function rendreFusee() {
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
    </div>`);
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
  JEU.taupe = { restant: 30, score: 0, serie: 0, cible: null, trous: Array(9).fill(null), fini: false, opStats: {} };
  JEU.dernier = { type: 'mode', mode: 'taupe' };
  nouvelleVoleeTaupe();
  rendreTaupe();
  // changement de volée automatique
  JEU.taupe.voleeTimer = toutesLes(() => {
    const t = JEU.taupe;
    if (t.fini) return;
    nouvelleVoleeTaupe(); rendreTaupe();
  }, 1500);
  JEU.taupe.chrono = toutesLes(() => {
    const t = JEU.taupe;
    t.restant -= .1;
    const el = $('#taupe-chrono'), barre = $('#taupe-barre');
    if (el) { el.textContent = Math.ceil(t.restant); el.classList.toggle('danger', t.restant <= 10); }
    if (barre) barre.style.width = `${t.restant / 30 * 100}%`;
    if (t.restant <= 0) finirTaupe();
  }, 100);
}
function nouvelleVoleeTaupe() {
  const t = JEU.taupe;
  const niveauMax = joueur.age <= 6 ? 10 : joueur.age <= 8 ? 20 : 30;
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
function rendreTaupe() {
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
    </div>`);
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
    sfx('taupe');
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
