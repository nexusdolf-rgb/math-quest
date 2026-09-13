/* ============================================================
   MATH QUEST v2 — questions.js
   Générateurs de questions pour tous les modes
   Une question = { consigne, visuel (HTML), options[], answer, op }
   ============================================================ */
'use strict';

function optionsNombre(bonne, decalages) {
  const opts = new Set([bonne]);
  melange(decalages).forEach(d => {
    const v = bonne + d;
    if (v >= 0 && opts.size < 4) opts.add(v);
  });
  let securite = 0;
  while (opts.size < 4 && securite++ < 30) opts.add(Math.max(0, bonne + alea(-6, 6)));
  return melange([...opts]);
}

/* Construit 4 options texte et recalcule l'index de la bonne réponse */
function pack(bonne, optionsValeurs, visuel, consigne, op) {
  const options = optionsValeurs.map(String);
  return { consigne, visuel, options, answer: options.indexOf(String(bonne)), op };
}

/* ---------- Calculs (add / sub / mul / mixed / tranches) ---------- */
function genereCalcul(operation, min = 1, max = 20, facteur = null, tranche = null) {
  let a, b, bonne, symbole, op = 'autre';
  if (operation === 'mul') {
    a = facteur; b = alea(1, 10); bonne = a * b; symbole = '×'; op = 'mul';
  } else if (operation === 'multranche') {
    a = alea(tranche[0], tranche[1]); b = alea(2, 10); bonne = a * b; symbole = '×'; op = 'mul';
  } else if (operation === 'divtranche') {
    b = alea(tranche[0], tranche[1]); bonne = alea(2, 10); a = b * bonne; symbole = '÷'; op = 'div';
  } else if (operation === 'div') {
    b = facteur || alea(2, 9); bonne = alea(2, 10); a = b * bonne; symbole = '÷'; op = 'div';
  } else if (operation === 'sub') {
    a = alea(Math.max(2, min), max); b = alea(min, Math.max(min, a)); bonne = a - b; symbole = '−'; op = 'sub';
  } else if (operation === 'mixed') {
    const type = choix(['add', 'sub', 'mul']);
    if (type === 'mul') { a = alea(2, Math.min(10, max)); b = alea(2, 10); bonne = a * b; symbole = '×'; op = 'mul'; }
    else if (type === 'sub') {
      a = alea(min + 1, max); b = alea(min, Math.max(min, a)); bonne = a - b; symbole = '−'; op = 'sub';
    } else { a = alea(min, max); b = alea(min, max); bonne = a + b; symbole = '+'; op = 'add'; }
  } else if (operation === 'mixeddur') {
    const type = choix(['add', 'sub', 'mul', 'mul']);
    if (type === 'mul') { a = alea(3, 10); b = alea(3, 10); bonne = a * b; symbole = '×'; op = 'mul'; }
    else if (type === 'sub') {
      a = alea(20, max); b = alea(min, Math.max(min, a - 1)); bonne = a - b; symbole = '−'; op = 'sub';
    } else { a = alea(min, max); b = alea(min, max); bonne = a + b; symbole = '+'; op = 'add'; }
  } else {
    a = alea(min, max); b = alea(min, max); bonne = a + b; symbole = '+'; op = 'add';
  }
  const distracteurs = [1, -1, 2, -2, 10, -10, symbole === '×' ? b : 0, symbole === '×' ? -b : b];
  const options = optionsNombre(bonne, distracteurs);
  return pack(bonne, options, `<div class="q-calcul">${a} ${symbole} ${b} = ?</div>`, 'Combien ça fait ?', op);
}

/* Petite expression pour le Tape-Taupe : renvoie { texte, valeur, op } */
function construireExpression(niveauMax) {
  const age = joueur ? joueur.age : 7;
  const type = choix(age <= 6 ? ['add', 'sub'] : ['add', 'sub', 'mul']);
  let a, b, val, sym, op;
  if (type === 'mul') { a = alea(2, Math.min(9, niveauMax)); b = alea(2, 5); val = a * b; sym = '×'; op = 'mul'; }
  else if (type === 'sub') { a = alea(4, niveauMax); b = alea(1, a - 1); val = a - b; sym = '−'; op = 'sub'; }
  else { a = alea(1, niveauMax); b = alea(1, niveauMax); val = a + b; sym = '+'; op = 'add'; }
  return { texte: `${a} ${sym} ${b}`, valeur: val, op };
}

/* ---------- Vrai / Faux ---------- */
function genereVraiFaux(min = 1, max = 20) {
  const a = alea(min, max), b = alea(min, max);
  const symbole = choix(['+', '−']);
  const grand = Math.max(a, b), petit = Math.min(a, b);
  const vraiResultat = symbole === '+' ? a + b : grand - petit;
  const juste = Math.random() < .5;
  const affiche = juste ? vraiResultat : vraiResultat + choix([1, -1, 2, -2, 3]);
  return {
    consigne: "L'opération est-elle correcte ?",
    visuel: `<div class="q-calcul">${symbole === '+' ? `${a} + ${b}` : `${grand} − ${petit}`} = ${affiche}</div>`,
    options: ['✅ Vrai', '❌ Faux'],
    answer: juste ? 0 : 1,
    op: 'autre'
  };
}

/* ---------- Nombre manquant ---------- */
function genereManquant() {
  const a = alea(2, 15), b = alea(2, 15);
  const plus = Math.random() < .5;
  let reponse, texte;
  if (plus) {
    if (Math.random() < .5) { reponse = a; texte = `⬜ + ${b} = ${a + b}`; }
    else { reponse = b; texte = `${a} + ⬜ = ${a + b}`; }
  } else {
    const grande = Math.max(a, b), petite = Math.min(a, b), resultat = grande - petite;
    if (Math.random() < .5) { reponse = grande; texte = `⬜ − ${petite} = ${resultat}`; }
    else { reponse = petite; texte = `${grande} − ⬜ = ${resultat}`; }
  }
  const options = optionsNombre(reponse, [1, -1, 2, -2]);
  return pack(reponse, options, `<div class="q-calcul">${texte}</div>`, 'Quel nombre se cache ?', 'autre');
}

/* ---------- Comparaison ---------- */
function genereComparaison() {
  const age = joueur ? joueur.age : 7;
  const max = age <= 6 ? 20 : 100;
  // moitié expressions, moitié nombres simples
  let g, d, reponse;
  if (Math.random() < .55) {
    const e1 = construireExpression(Math.min(max, 30));
    let e2 = construireExpression(Math.min(max, 30));
    let garde = 0;
    while (e2.valeur === e1.valeur && garde++ < 10) e2 = construireExpression(Math.min(max, 30));
    g = e1; d = e2;
    reponse = e1.valeur === e2.valeur ? 2 : e1.valeur > e2.valeur ? 0 : 1;
    return {
      consigne: 'Compare les deux calculs !',
      visuel: `<div class="comparaison-visuel">
        <span class="comparaison-nombre" style="font-size:1.9rem">${g.texte}</span>
        <span class="comparaison-trou">?</span>
        <span class="comparaison-nombre" style="font-size:1.9rem">${d.texte}</span></div>`,
      options: ['<b>＞</b><br>plus grand', '<b>＜</b><br>plus petit', '<b>＝</b><br>égal'],
      answer: reponse, op: g.op
    };
  }
  g = alea(1, max); d = alea(1, max);
  reponse = g === d ? 2 : g > d ? 0 : 1;
  return {
    consigne: 'Quel signe va au milieu ?',
    visuel: `<div class="comparaison-visuel">
      <span class="comparaison-nombre">${g}</span><span class="comparaison-trou">?</span><span class="comparaison-nombre">${d}</span></div>`,
    options: ['<b>＞</b><br>plus grand', '<b>＜</b><br>plus petit', '<b>＝</b><br>égal'],
    answer: reponse, op: 'autre'
  };
}

/* ---------- Fractions (pizzas) ---------- */
function genereFraction() {
  const den1 = alea(2, 6), num1 = alea(1, den1);
  let num2, den2;
  if (Math.random() < .2) {
    const k = choix([2, 3]);
    den2 = den1 * k; num2 = num1 * k;
    if (den2 > 6) { den2 = den1; num2 = num1; }
  } else { den2 = alea(2, 6); num2 = alea(1, den2); }
  const cmp = num1 * den2 - num2 * den1;
  const answer = cmp === 0 ? 2 : cmp > 0 ? 0 : 1;
  const pizza = (num, den) => {
    const deg = 360 / den * num;
    return `<div class="fraction-item"><div class="pizza" style="background:conic-gradient(#f87171 0 ${deg}deg,#fef3c7 ${deg}deg 360deg)"></div>
      <div class="fraction-texte">${num}/${den}</div></div>`;
  };
  return {
    consigne: 'Quelle part de pizza est la plus grande ?',
    visuel: `<div class="fraction-visuel">${pizza(num1, den1)}<div class="vs-bulle">VS</div>${pizza(num2, den2)}</div>`,
    options: ['La première 🍕', 'La deuxième 🍕', 'Égalité 🟰'],
    answer, op: 'autre'
  };
}

/* ---------- Suites logiques ---------- */
function genereSuite() {
  const debut = alea(1, 9), pas = alea(2, 6);
  const termes = [0, 1, 2, 3].map(i => debut + i * pas);
  const reponse = debut + 4 * pas;
  const options = optionsNombre(reponse, [pas, -pas, 1, -1, 2]);
  return pack(reponse, options,
    `<div class="q-calcul">${termes.join(', ')}, <span style="color:#8b5cf6">?</span></div>`,
    'Quel est le prochain nombre ?', 'autre');
}

/* ---------- Compte rapide ---------- */
function genereCompte() {
  const nombre = alea(3, 15);
  const emoji = choix(OBJETS_COMPTE);
  const options = optionsNombre(nombre, [1, -1, 2, -2]);
  return pack(nombre, options,
    `<div class="objets-compte">${emoji.repeat(nombre)}</div>`,
    'Compte vite les objets !', 'autre');
}

/* ---------- Dizaines et unités (barres Montessori) ---------- */
function genereDizaines() {
  const diz = alea(1, 6), uni = alea(0, 9);
  const reponse = diz * 10 + uni;
  const options = optionsNombre(reponse, [1, -1, 10, -10, 2]);
  const barres = Array.from({ length: diz }, () => '<div class="diz-barre">10</div>').join('');
  const cubes = Array.from({ length: uni }, () => '<div class="unite-cube"></div>').join('');
  return pack(reponse, options, `
    <div class="dizaines-visuel">
      <div class="diz-groupe"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">${barres}</div>
        <span class="diz-legende">${diz} barre${diz > 1 ? 's' : ''} de dix</span></div>
      ${uni ? `<div class="diz-groupe"><div class="unites">${cubes}</div>
        <span class="diz-legende">${uni} cube${uni > 1 ? 's' : ''}</span></div>` : ''}
    </div>`, 'Combien y a-t-il de cubes en tout ?', 'autre');
}

/* ---------- Horloge ---------- */
function horlogeSVG(heures, minutes) {
  const angleMin = minutes * 6;
  const angleHeu = (heures % 12) * 30 + minutes * .5;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30 * Math.PI / 180;
    const x1 = 100 + Math.sin(a) * 78, y1 = 100 - Math.cos(a) * 78;
    const x2 = 100 + Math.sin(a) * 88, y2 = 100 - Math.cos(a) * 88;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2d2350" stroke-width="${i % 3 === 0 ? 4 : 2}" stroke-linecap="round"/>`;
  }).join('');
  return `<svg class="horloge-svg" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="94" fill="#fff" stroke="#8b5cf6" stroke-width="6"/>
    ${ticks}
    <line x1="100" y1="100" x2="100" y2="52" stroke="#2d2350" stroke-width="8" stroke-linecap="round"
      transform="rotate(${angleHeu} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="32" stroke="#ec4899" stroke-width="5" stroke-linecap="round"
      transform="rotate(${angleMin} 100 100)"/>
    <circle cx="100" cy="100" r="7" fill="#7c3aed"/>
  </svg>`;
}
function formatHeure(h, m) { return `${h}h${m ? String(m).padStart(2, '0') : '00'}`; }
function genereHorloge() {
  const age = joueur ? joueur.age : 7;
  const h = alea(1, 12);
  const m = age <= 6 ? choix([0, 30]) : choix([0, 15, 30, 45]);
  const bonne = formatHeure(h, m);
  const mauvaises = new Set();
  while (mauvaises.size < 3) {
    if (Math.random() < .5) {
      const dh = ((h + alea(1, 4) - 1 + 12) % 12) + 1;
      mauvaises.add(formatHeure(dh, m));
    } else {
      const dm = choix([0, 15, 30, 45].filter(x => x !== m));
      mauvaises.add(formatHeure(h, dm));
    }
  }
  const options = melange([bonne, ...mauvaises]);
  return {
    consigne: 'Quelle heure est-il ?',
    visuel: horlogeSVG(h, m),
    options, answer: options.indexOf(bonne), op: 'autre'
  };
}

/* ---------- Monnaie ---------- */
function genereMonnaie() {
  const age = joueur ? joueur.age : 7;
  const valeurs = [];
  if (age <= 6) {
    const n = alea(2, 5);
    for (let i = 0; i < n; i++) valeurs.push(choix([1, 2]));
  } else {
    const nBillets = alea(0, 2);
    for (let i = 0; i < nBillets; i++) valeurs.push(choix([5, 10]));
    const nPieces = alea(2, 5);
    for (let i = 0; i < nPieces; i++) valeurs.push(choix([1, 2]));
  }
  // Le type d'affichage dépend TOUJOURS de la valeur (cohérence pédagogique)
  const rendu = {
    1: '<div class="piece-monnaie p1">1&nbsp;€</div>',
    2: '<div class="piece-monnaie p2">2&nbsp;€</div>',
    5: '<div class="billet b5">5&nbsp;€</div>',
    10: '<div class="billet b10">10&nbsp;€</div>'
  };
  const total = valeurs.reduce((a, b) => a + b, 0);
  const visuelItems = valeurs.map(v => rendu[v]).join('');
  const options = optionsNombre(total, [1, -1, 2, -2, 5, -5, 10]);
  return pack(total, options, `<div class="monnaie-visuel">${visuelItems}</div>`,
    'Combien y a-t-il d\'argent en tout ?', 'autre');
}

/* ---------- Formes géométriques ---------- */
function genereFormes() {
  const age = joueur ? joueur.age : 7;
  const dispo = age <= 6
    ? FORMES.filter(f => ['Cercle', 'Triangle', 'Carré', 'Rectangle', 'Étoile'].includes(f.nom))
    : FORMES;
  const forme = choix(dispo);
  const couleur = choix(FORME_COULEURS);
  const svg = `<svg class="forme-svg" viewBox="0 0 180 180">${forme.svg.replace('{c}', couleur)}</svg>`;
  // Tantôt on demande le nom, tantôt le nombre de côtés
  if (forme.cotes !== null && Math.random() < .45) {
    const options = optionsNombre(forme.cotes, [1, -1, 2, -2]).filter(v => v >= 0);
    const packOpt = options.slice(0, 4);
    return pack(forme.cotes, packOpt, svg, 'Combien cette forme a-t-elle de côtés ?', 'autre');
  }
  const mauvaises = new Set();
  while (mauvaises.size < 3) {
    const f = choix(dispo);
    if (f.nom !== forme.nom) mauvaises.add(f.nom);
  }
  const options = melange([forme.nom, ...mauvaises]);
  return {
    consigne: 'Comment s\'appelle cette forme ?',
    visuel: svg,
    options, answer: options.indexOf(forme.nom), op: 'autre'
  };
}

/* ---------- Lots de questions ---------- */
function genereQuestionsNiveau(niveau) {
  return Array.from({ length: niveau.questions }, () => {
    if (niveau.operation === 'mul') return genereCalcul('mul', 0, 0, niveau.facteur);
    if (niveau.operation === 'multranche') return genereCalcul('multranche', 0, 0, null, niveau.tranche);
    if (niveau.operation === 'divtranche') return genereCalcul('divtranche', 0, 0, null, niveau.tranche);
    if (niveau.operation === 'mixeddur') return genereCalcul('mixeddur', niveau.min, niveau.max);
    if (niveau.operation === 'mixed') return genereCalcul('mixed', niveau.min, niveau.max);
    return genereCalcul(niveau.operation, niveau.min, niveau.max);
  });
}
function genereQuestionsMode(mode) {
  const constructeurs = {
    'divisions': () => genereCalcul('div'),
    'vrai-faux': () => genereVraiFaux(1, 20),
    'manquant': genereManquant,
    'comparaison': genereComparaison,
    'fractions': genereFraction,
    'suite': genereSuite,
    'compte': genereCompte,
    'dizaines': genereDizaines,
    'horloge': genereHorloge,
    'monnaie': genereMonnaie,
    'formes': genereFormes
  };
  const nb = mode === 'compte' ? 10 : 8;
  return Array.from({ length: nb }, constructeurs[mode]);
}
function genereQuestionsDuel(difficulte) {
  const cfg = {
    facile: ['mixed', 1, 15],
    moyen: ['mixed', 1, 25],
    difficile: ['mixeddur', 10, 50]
  }[difficulte];
  return Array.from({ length: 5 }, () => genereCalcul(cfg[0], cfg[1], cfg[2]));
}
function genereDefiJour() {
  const age = joueur.age;
  const max = age <= 6 ? 10 : age <= 8 ? 20 : 40;
  const types = age <= 6
    ? [() => genereCalcul('add', 1, 10), () => genereCalcul('sub', 1, 10)]
    : [() => genereCalcul('mixed', 1, max), () => genereVraiFaux(1, max), genereManquant, genereSuite,
       () => genereComparaison(), () => genereCalcul('div')];
  return Array.from({ length: 10 }, () => choix(types)());
}
function genereBoss() {
  return Array.from({ length: 15 }, () => {
    const t = choix(['mixeddur', 'mul', 'div', 'horloge', 'formes', 'comparaison']);
    if (t === 'mixeddur') return genereCalcul('mixeddur', 10, 60);
    if (t === 'mul') return genereCalcul('multranche', 0, 0, null, [4, 9]);
    if (t === 'div') return genereCalcul('div');
    if (t === 'horloge') return genereHorloge();
    if (t === 'formes') return genereFormes();
    return genereComparaison();
  });
}
