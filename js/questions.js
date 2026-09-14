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
function pack(bonne, optionsValeurs, visuel, consigne, op, skill) {
  const options = optionsValeurs.map(String);
  return { consigne, visuel, options, answer: options.indexOf(String(bonne)), op, skill: skill || null };
}
/* Petite explication pédagogique affichée par le Prof après une erreur */
function explicationCalcul(a, b, symbole) {
  if (symbole === '+') {
    const r = a + b, d = 10 - (a % 10);
    if (a >= 10 && b > d && a % 10 !== 0) {
      return `Astuce de la dizaine : ${a} + ${d} = ${a + d}, puis il reste ${b - d}, donc ${a} + ${b} = ${r}. 👍`;
    }
    return `Compte de ${b > 1 ? b + ' en ' + b : '1 en 1'} à partir de ${a} : tu arrives à ${r}.`;
  }
  if (symbole === '−') {
    const r = a - b;
    const uniteB = b % 10, uniteA = a % 10;
    if (a >= 15 && uniteB > uniteA) {
      const palier = a - uniteA;
      return `${a} − ${b} : descends d'abord à ${palier} (${a} − ${uniteA}), puis retire encore ${b - uniteA} → ${r}.`;
    }
    return `Compte à rebours de ${b} pas depuis ${a}, ou dessine ${a} points et barre-en ${b} : il en reste ${r}.`;
  }
  if (symbole === '×') {
    const r = a * b;
    if (b > 5) { const x = b - 5; return `Décompose avec la table de 5 : ${a} × ${b} = ${a} × 5 + ${a} × ${x} = ${a * 5} + ${a * x} = ${r}.`; }
    if (b === 5) return `${a} × 5, c'est compter de 5 en 5, ${a} fois : ${r}. La table de 5 finit toujours par 0 ou 5 !`;
    if (b === 2) return `${a} × 2, c'est le double de ${a} : ${r}.`;
    return `${a} × ${b}, c'est ${a} ajouté ${b} fois : ${Array.from({ length: b }, () => a).join(' + ')} = ${r}.`;
  }
  if (symbole === '÷') {
    const q = a / b;
    return `${a} ÷ ${b}, c'est demander « combien de fois ${b} dans ${a} ? ». Comme ${b} × ${q} = ${a}, la réponse est ${q}.`;
  }
  return '';
}
/* Construit une question de calcul nue (réutilisée par le Prof intelligent) */
function questionCalculee(a, b, symbole, op, skill) {
  const bonne = symbole === '+' ? a + b : symbole === '−' ? a - b
    : symbole === '×' ? a * b : a / b;
  const distracteurs = [1, -1, 2, -2, 10, -10, symbole === '×' || symbole === '÷' ? b : 0,
    symbole === '×' ? -b : b, symbole === '÷' ? b : -bonne];
  const q = pack(bonne, optionsNombre(bonne, distracteurs),
    `<div class="q-calcul">${a} ${symbole} ${b} = ?</div>`, 'Combien ça fait ?', op, skill);
  q.exp = explicationCalcul(a, b, symbole);
  return q;
}
/* Étiquettes de compétence du Prof intelligent */
function skillAddition(r) { return r <= 10 ? 'add-10' : r <= 20 ? 'add-20' : r <= 100 ? 'add-100' : 'add-grand'; }
function skillSoustraction(r) { return r <= 10 ? 'sub-10' : r <= 20 ? 'sub-20' : r <= 100 ? 'sub-100' : 'sub-grand'; }

/* Niveau de difficulté selon l'âge (jusqu'aux adultes) */
function profilAge() {
  const a = joueur ? joueur.age : 7;
  if (a <= 6)  return { max: 10,  mix: 10,  mul1: 2, mul2: 5,  div: false, pasMax: 4,  dev: 50,   hor: [0, 30],            money: false, mem: 'add', taupe: 10, taupeMs: 1500, diz: 6 };
  if (a <= 8)  return { max: 20,  mix: 20,  mul1: 2, mul2: 8,  div: false, pasMax: 6,  dev: 100,  hor: [0, 15, 30, 45],    money: true,  mem: 'add', taupe: 20, taupeMs: 1500, diz: 7 };
  if (a <= 10) return { max: 40,  mix: 30,  mul1: 3, mul2: 10, div: true,  pasMax: 9,  dev: 200,  hor: 'cinq',            money: true,  mem: 'mul', taupe: 30, taupeMs: 1400, diz: 8 };
  if (a <= 12) return { max: 60,  mix: 40,  mul1: 4, mul2: 10, div: true,  pasMax: 11, dev: 300,  hor: 'cinq',            money: true,  mem: 'mul', taupe: 40, taupeMs: 1300, diz: 9 };
  if (a <= 15) return { max: 120, mix: 80,  mul1: 6, mul2: 12, div: true,  pasMax: 13, dev: 500,  hor: 'cinq',            money: 20,   mem: 'div', taupe: 60, taupeMs: 1200, diz: 9, divB: 11, divQ: 12 };
  return              { max: 250, mix: 150, mul1: 7, mul2: 12, div: true,  pasMax: 16, dev: 1000, hor: 'cinq',            money: 20,   mem: 'div', taupe: 90, taupeMs: 1100, diz: 9, divB: 12, divQ: 12 };
}

/* ---------- Calculs (add / sub / mul / mixed / tranches) ---------- */
function genereCalcul(operation, min = 1, max = 20, facteur = null, tranche = null) {
  let a, b, bonne, symbole, op = 'autre';
  const p = profilAge();
  if (operation === 'mul') {
    a = facteur; b = alea(1, 10); bonne = a * b; symbole = '×'; op = 'mul';
  } else if (operation === 'multranche') {
    a = alea(tranche[0], tranche[1]); b = alea(2, 10); bonne = a * b; symbole = '×'; op = 'mul';
  } else if (operation === 'divtranche') {
    b = alea(tranche[0], tranche[1]); bonne = alea(2, 10); a = b * bonne; symbole = '÷'; op = 'div';
  } else if (operation === 'div') {
    b = alea(2, p.div ? (p.divB || 9) : 5); bonne = alea(2, p.divQ || p.mul2 || 10); a = b * bonne; symbole = '÷'; op = 'div';
  } else if (operation === 'sub') {
    a = alea(Math.max(2, min), max); b = alea(min, Math.max(min, a)); bonne = a - b; symbole = '−'; op = 'sub';
  } else if (operation === 'mixed' || operation === 'mixeddur') {
    const dur = operation === 'mixeddur';
    const ops = dur ? ['add', 'sub', 'mul', 'mul', ...(p.div ? ['div'] : [])]
                   : ['add', 'sub', ...(joueur && joueur.age >= 7 ? ['mul'] : []), ...(p.div ? ['div'] : [])];
    const type = choix(ops);
    const M = dur ? Math.round(p.mix * 1.4) : p.mix;
    if (type === 'mul') { a = alea(2, p.mul2); b = alea(p.mul1, Math.max(p.mul1, p.mul2)); bonne = a * b; symbole = '×'; op = 'mul'; }
    else if (type === 'div') { b = alea(2, p.divB || 9); bonne = alea(2, p.divQ || 10); a = b * bonne; symbole = '÷'; op = 'div'; }
    else if (type === 'sub') { a = alea(Math.round(M / 2) + 1, M); b = alea(1, a); bonne = a - b; symbole = '−'; op = 'sub'; }
    else { a = alea(1, M); b = alea(1, M); bonne = a + b; symbole = '+'; op = 'add'; }
  } else {
    a = alea(min, max); b = alea(min, max); bonne = a + b; symbole = '+'; op = 'add';
  }
  const distracteurs = [1, -1, 2, -2, 10, -10, symbole === '×' || symbole === '÷' ? b : 0,
                        symbole === '×' ? -b : b, symbole === '÷' ? b : -bonne];
  const options = optionsNombre(bonne, distracteurs);
  let skill = null;
  if (op === 'add') skill = skillAddition(bonne);
  else if (op === 'sub') skill = skillSoustraction(bonne);
  else if (op === 'mul') skill = [a, b].filter(x => x >= 2 && x <= 12).map(x => 'mul-' + x);
  else if (op === 'div') skill = 'div-' + b;
  return pack(bonne, options, `<div class="q-calcul">${a} ${symbole} ${b} = ?</div>`, 'Combien ça fait ?', op, skill);
}

/* Petite expression pour les jeux d'arcade / comparaisons : { texte, valeur, op } */
function construireExpression(niveauMax) {
  const age = joueur ? joueur.age : 7;
  const types = age <= 6 ? ['add', 'sub']
              : age <= 9 ? ['add', 'sub', 'mul']
              : ['add', 'sub', 'mul', 'div'];
  const type = choix(types);
  let a, b, val, sym, op;
  if (type === 'mul') { a = alea(2, Math.min(9, Math.round(niveauMax / 3))); b = alea(2, Math.min(9, Math.round(niveauMax / 2))); val = a * b; sym = '×'; op = 'mul'; }
  else if (type === 'div') { b = alea(2, 9); val = alea(2, 10); a = b * val; sym = '÷'; op = 'div'; }
  else if (type === 'sub') { a = alea(4, niveauMax); b = alea(1, a - 1); val = a - b; sym = '−'; op = 'sub'; }
  else { a = alea(1, niveauMax); b = alea(1, niveauMax); val = a + b; sym = '+'; op = 'add'; }
  return { texte: `${a} ${sym} ${b}`, valeur: val, op };
}

/* ---------- Vrai / Faux ---------- */
function genereVraiFaux(min, max) {
  const p = profilAge();
  const cap = max || p.mix;
  const e = construireExpression(cap);
  const juste = Math.random() < .5;
  const affiche = juste ? e.valeur : e.valeur + choix([1, -1, 2, -2, 3, 10, -10]);
  return {
    consigne: "L'opération est-elle correcte ?",
    visuel: `<div class="q-calcul">${e.texte} = ${affiche}</div>`,
    options: ['✅ Vrai', '❌ Faux'],
    answer: juste ? 0 : 1,
    op: e.op
  };
}

/* ---------- Nombre manquant ---------- */
function genereManquant() {
  const p = profilAge();
  let reponse, texte, op = 'autre';
  if (p.div && Math.random() < .35) {
    // multiplication à trou (et parfois division)
    if (Math.random() < .5) {
      const a = alea(2, p.mul2), b = alea(2, p.mul2);
      reponse = Math.random() < .5 ? a : b;
      texte = reponse === a ? `⬜ × ${b} = ${a * b}` : `${a} × ⬜ = ${a * b}`;
    } else {
      const div = alea(2, 9), q = alea(2, 10), total = div * q;
      if (Math.random() < .5) { reponse = div; texte = `${total} ÷ ⬜ = ${q}`; }
      else { reponse = total; texte = `⬜ ÷ ${div} = ${q}`; }
    }
    op = 'mul';
  } else {
    const a = alea(2, Math.max(15, p.mix)), b = alea(2, Math.max(15, p.mix));
    const plus = Math.random() < .5;
    if (plus) {
      if (Math.random() < .5) { reponse = a; texte = `⬜ + ${b} = ${a + b}`; }
      else { reponse = b; texte = `${a} + ⬜ = ${a + b}`; }
      op = 'add';
    } else {
      const grande = Math.max(a, b), petite = Math.min(a, b), resultat = grande - petite;
      if (Math.random() < .5) { reponse = grande; texte = `⬜ − ${petite} = ${resultat}`; }
      else { reponse = petite; texte = `${grande} − ⬜ = ${resultat}`; }
      op = 'sub';
    }
  }
  const options = optionsNombre(reponse, [1, -1, 2, -2, 10, -10]);
  return pack(reponse, options, `<div class="q-calcul">${texte}</div>`, 'Quel nombre se cache ?', op);
}

/* ---------- Comparaison ---------- */
function genereComparaison() {
  const p = profilAge();
  let g, d, reponse;
  if (Math.random() < .55) {
    const e1 = construireExpression(p.mix);
    let e2 = construireExpression(p.mix);
    let garde = 0;
    while (e2.valeur === e1.valeur && garde++ < 10) e2 = construireExpression(p.mix);
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
  g = alea(1, p.max); d = alea(1, p.max);
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
  const p = profilAge();
  const debut = alea(1, 9), pas = alea(2, p.pasMax);
  const termes = [0, 1, 2, 3].map(i => debut + i * pas);
  const reponse = debut + 4 * pas;
  const options = optionsNombre(reponse, [pas, -pas, 1, -1, 2]);
  return pack(reponse, options,
    `<div class="q-calcul">${termes.join(', ')}, <span style="color:#8b5cf6">?</span></div>`,
    'Quel est le prochain nombre ?', 'autre');
}

/* ---------- Suites Pro (ados / adultes) ---------- */
function genereSuitePro() {
  const a = joueur ? joueur.age : 7;
  if (a < 11) return genereSuite();
  const types = a >= 13
    ? ['geo', 'carres', 'fib', 'arith', 'mul', 'neg']
    : ['geo', 'carres', 'fib', 'arith', 'mul'];
  const t = choix(types);
  let termes, reponse;
  if (t === 'geo') {
    const debut = alea(2, 5), raison = a >= 13 ? choix([2, 3, 4]) : choix([2, 3]);
    termes = [0, 1, 2, 3].map(i => debut * raison ** i);
    reponse = debut * raison ** 4;
  } else if (t === 'carres') {
    const n = alea(2, 6);
    termes = [0, 1, 2, 3].map(i => (n + i) ** 2);
    reponse = (n + 4) ** 2;
  } else if (t === 'fib') {
    const x = alea(2, 7), y = alea(x + 1, x + 6);
    const s = [x, y];
    for (let i = 2; i < 5; i++) s.push(s[i - 1] + s[i - 2]);
    termes = s.slice(0, 4); reponse = s[4];
  } else if (t === 'mul') {
    const table = alea(6, a >= 13 ? 12 : 10);
    termes = [1, 2, 3, 4].map(i => table * i);
    reponse = table * 5;
  } else if (t === 'neg') {
    const debut = -alea(4, 20), pas = alea(3, 11);
    termes = [0, 1, 2, 3].map(i => debut + i * pas);
    reponse = debut + 4 * pas;
  } else {
    const debut = alea(3, 25), pas = alea(4, 17);
    termes = [0, 1, 2, 3].map(i => debut + i * pas);
    reponse = debut + 4 * pas;
  }
  const options = optionsNombre(reponse, [1, -1, 2, -2, 10, -10, Math.max(2, Math.round(Math.abs(reponse) * .1))]);
  return pack(reponse, options,
    `<div class="q-calcul">${termes.join(', ')}, <span style="color:#8b5cf6">?</span></div>`,
    'Quel est le prochain nombre ?', 'autre');
}

/* ---------- Équations et pourcentages (ados / adultes) ---------- */
function genereEquation() {
  const a = joueur ? joueur.age : 7;
  if (a < 10) return genereManquant();
  const M = a >= 13 ? 40 : 20;
  const t = a >= 13 ? choix(['xplus', 'xmoins', 'xfois', 'pct', 'pct'])
                    : choix(['xplus', 'xmoins', 'xfois']);
  let reponse, texte, op = 'autre';
  if (t === 'xplus') {
    const c = alea(2, M), x = alea(1, M);
    reponse = x; texte = `⬜ + ${c} = ${x + c}`;
  } else if (t === 'xmoins') {
    const c = alea(2, M), x = alea(c + 1, c + M);
    reponse = x; texte = `⬜ − ${c} = ${x - c}`;
  } else if (t === 'xfois') {
    const c = alea(2, a >= 13 ? 12 : 10), x = alea(2, 10);
    reponse = x; texte = `⬜ × ${c} = ${c * x}`; op = 'mul';
  } else {
    const p = choix([10, 20, 25, 50, 75]);
    const multiple = p === 50 ? 2 : p === 10 ? 10 : 4;
    const base = alea(2, 16) * multiple;
    reponse = base * p / 100;
    texte = `${p} % de ${base} = ?`;
  }
  const options = optionsNombre(reponse, [1, -1, 2, -2, 5, -5, 10, -10]);
  return pack(reponse, options, `<div class="q-calcul">${texte}</div>`,
    t === 'pct' ? 'Combien ça fait ?' : 'Quel nombre remplace ⬜ ?', op);
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
  const p = profilAge();
  const diz = alea(1, p.diz), uni = alea(0, 9);
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
  const p = profilAge();
  const h = alea(1, 12);
  const m = Array.isArray(p.hor) ? choix(p.hor) : choix([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const minutesPossibles = Array.isArray(p.hor) ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const bonne = formatHeure(h, m);
  const mauvaises = new Set();
  while (mauvaises.size < 3) {
    if (Math.random() < .5) {
      const dh = ((h + alea(1, 4) - 1 + 12) % 12) + 1;
      mauvaises.add(formatHeure(dh, m));
    } else {
      const dm = choix(minutesPossibles.filter(x => x !== m));
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
  const p = profilAge();
  const valeurs = [];
  if (!p.money) {
    const n = alea(2, 5);
    for (let i = 0; i < n; i++) valeurs.push(choix([1, 2]));
  } else {
    const nBillets = alea(1, p.money === 20 ? 3 : 2);
    for (let i = 0; i < nBillets; i++) valeurs.push(choix(p.money === 20 ? [5, 10, 20] : [5, 10]));
    const nPieces = alea(2, 5);
    for (let i = 0; i < nPieces; i++) valeurs.push(choix([1, 2]));
  }
  // Le type d'affichage dépend TOUJOURS de la valeur (cohérence pédagogique)
  const rendu = {
    1: '<div class="piece-monnaie p1">1&nbsp;€</div>',
    2: '<div class="piece-monnaie p2">2&nbsp;€</div>',
    5: '<div class="billet b5">5&nbsp;€</div>',
    10: '<div class="billet b10">10&nbsp;€</div>',
    20: '<div class="billet b20">20&nbsp;€</div>'
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
    'formes': genereFormes,
    'suite-pro': genereSuitePro,
    'equations': genereEquation,
    'marche': genereMarche,
    'compte-bon': genereCompteBon
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
  const p = profilAge();
  const types = !p.div
    ? [() => genereCalcul('add', 1, 10), () => genereCalcul('sub', 1, 10)]
    : [() => genereCalcul('mixed'), genereVraiFaux, genereManquant, genereSuite,
       genereComparaison, () => genereCalcul('div'), genereSuite];
  // Pour les plus grands, un peu de défi chrono mental corsé
  if (joueur.age >= 11) types.push(() => genereCalcul('mixeddur'), () => genereCalcul('multranche', 0, 0, null, [p.mul1, p.mul2]));
  return Array.from({ length: 10 }, () => choix(types)());
}
/* ---------- Le Petit Marchand : rendre la monnaie ---------- */
function genereMarche() {
  const p = profilAge();
  const a = joueur ? joueur.age : 7;
  let billetsDispo, prixMax;
  if (a <= 6) { billetsDispo = [5, 10]; prixMax = 9; }
  else if (a <= 10) { billetsDispo = [10, 20]; prixMax = 19; }
  else if (a <= 15) { billetsDispo = [20, 50]; prixMax = 48; }
  else { billetsDispo = [20, 50, 100]; prixMax = 95; }
  const billet = choix(billetsDispo);
  const prix = alea(1, Math.min(prixMax, billet - 1));
  const rendu = billet - prix;
  const articles = ['🍎 Pomme', '🍞 Pain', '🥖 Baguette', '🧃 Jus de fruit', '🍪 Biscuit',
    '📒 Cahier', '✏️ Crayon', '🍫 Chocolat', '🍭 Sucette', '🧸 Petit jouet', '📕 Livre', '🥤 Soda'];
  const article = choix(articles);
  const options = optionsNombre(rendu, [1, -1, 2, -2, 5, -5, 10, -10]);
  return pack(rendu, options, `
    <div class="marche-visuel">
      <div class="marche-article">${article.split(' ')[0]}<span>${article.split(' ').slice(1).join(' ')}</span></div>
      <div class="marche-prix">Prix : <b>${prix}&nbsp;€</b></div>
      <div class="marche-paye">Tu paies avec <b>${billet}&nbsp;€</b></div>
    </div>`, 'Combien te rend le marchand ?', 'autre');
}

/* ---------- Le Bon Compte : quelle opération donne le nombre cible ? ---------- */
function genereCompteBon() {
  const p = profilAge();
  const a = joueur ? joueur.age : 7;
  const cible = alea(Math.round(p.mix * .4) + 4, p.mix);
  // Construit 4 expressions dont une exactement égale à la cible
  const opsPossibles = ['add', 'sub',
    ...(a >= 8 && p.mul2 ? ['mul'] : []),
    ...(p.div ? ['div'] : [])];
  const faireExpr = valeurVoulue => {
    valeurVoulue = Math.max(2, valeurVoulue);
    const t = choix(opsPossibles);
    let texte, valeur;
    if (t === 'mul' && valeurVoulue > 0) {
      // un produit qui tombe (ou presque si fausse) sur la valeur voulue
      const diviseurs = [];
      for (let d = 2; d <= p.mul2; d++) if (valeurVoulue % d === 0) diviseurs.push(d);
      if (diviseurs.length) {
        const d = choix(diviseurs);
        texte = `${valeurVoulue / d} × ${d}`; valeur = valeurVoulue;
      } else {
        // pas de produit tombant juste : on retombe sur la cible par soustraction
        const retrait = alea(1, Math.max(1, valeurVoulue - 1));
        texte = `${valeurVoulue + retrait} − ${retrait}`; valeur = valeurVoulue;
      }
    } else if (t === 'div' && valeurVoulue > 1 && valeurVoulue <= p.mul2) {
      // on reste dans les tables connues : quotient ≤ table max, pas de gros dividende
      const q = valeurVoulue, b = alea(2, p.divB || 9);
      texte = `${q * b} ÷ ${b}`; valeur = q;
    } else if (t === 'sub') {
      const a = valeurVoulue + alea(1, Math.max(2, Math.round(p.mix * .3)));
      texte = `${a} − ${a - valeurVoulue}`; valeur = valeurVoulue;
    } else {
      const b = alea(1, Math.max(1, valeurVoulue - 1));
      texte = `${valeurVoulue - b} + ${b}`; valeur = valeurVoulue;
    }
    return { texte, valeur };
  };
  const bon = faireExpr(cible);
  bon.texte = bon.texte; // tombe pile sur la cible
  const mauvaises = new Set();
  let garde = 0;
  while (mauvaises.size < 3 && garde++ < 60) {
    const e = faireExpr(cible + choix([-12, -10, -5, -3, -2, -1, 1, 2, 3, 5, 10, 12]));
    if (e.valeur !== cible && ![...mauvaises].some(x => x.texte === e.texte)) mauvaises.add(e);
  }
  const liste = melange([bon, ...mauvaises]);
  return {
    consigne: 'Quelle opération fait EXACTEMENT le nombre ?',
    visuel: `<div class="comptebon-cible">🎯 ${cible}</div>`,
    options: liste.map(e => e.texte),
    answer: liste.findIndex(e => e.texte === bon.texte),
    op: 'autre'
  };
}

/* ---------- Boss de l'aventure (3 combats différents) ---------- */
function genereBossAventure(n) {
  const p = profilAge();
  let types;
  if (n === 1) {
    types = ['mixeddur', 'horloge', 'formes', 'comparaison', genereSuite];
    if (joueur.age >= 7) types.push('mul');
    if (p.div) types.push('div');
  } else if (n === 2) {
    types = ['mixeddur', 'multranche', genereSuitePro, genereEquation, 'comparaison', genereVraiFaux];
    if (p.div) types.push('divtranche');
  } else {
    types = ['mixeddur', 'multranche', 'divtranche', genereSuitePro, genereEquation,
             genereComparaison, genereVraiFaux, genereSuitePro];
  }
  const resous = t => {
    if (t === 'mixeddur') return genereCalcul('mixeddur');
    if (t === 'mul') return genereCalcul('multranche', 0, 0, null, [p.mul1, p.mul2]);
    if (t === 'div') return genereCalcul('div');
    if (t === 'multranche') return genereCalcul('multranche', 0, 0, null, [p.mul1, p.mul2]);
    if (t === 'divtranche') return genereCalcul('divtranche', 0, 0, null, [2, p.div ? (p.divB || 9) : 3]);
    if (t === 'horloge') return genereHorloge();
    if (t === 'formes') return genereFormes();
    if (t === 'comparaison') return genereComparaison();
    if (typeof t === 'function') return t();
    return genereVraiFaux();
  };
  const nb = BOSS_AVENTURE[n - 1].questions;
  return Array.from({ length: nb }, () => resous(choix(types)));
}

function genereBoss() {
  const p = profilAge();
  const types = ['mixeddur', 'horloge', 'formes', 'comparaison', genereSuite];
  if (joueur.age >= 7) types.push('mul');
  if (p.div) types.push('div');
  if (joueur.age >= 11) types.push('mul', 'div');
  return Array.from({ length: 15 }, () => {
    const t = choix(types);
    if (t === 'mixeddur') return genereCalcul('mixeddur');
    if (t === 'mul') return genereCalcul('multranche', 0, 0, null, [p.mul1, p.mul2]);
    if (t === 'div') return genereCalcul('div');
    if (t === 'horloge') return genereHorloge();
    if (t === 'formes') return genereFormes();
    if (typeof t === 'function') return t();
    return genereComparaison();
  });
}
