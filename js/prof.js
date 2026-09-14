/* ============================================================
   MATH QUEST v3.3 — prof.js
   Prof intelligent : carnet de compétences, sessions adaptatives
   qui ciblent les points faibles, et conseils. Aucune donnée ne
   sort de l'appareil (tout reste dans la sauvegarde locale).
   ============================================================ */
'use strict';

const PROF_HIST_MAX = 14; // on garde les 14 derniers résultats par compétence

/* ---------- Catalogue des compétences travaillables ---------- */
function profCatalogue(age) {
  age = age || (joueur ? joueur.age : 7);
  const liste = [];
  const push = (key, lib, dom, ageMini, gen) => { if (age >= ageMini) liste.push({ key, lib, dom, ageMini, gen }); };

  /* Additions / soustractions par ampleur de résultat */
  push('add-10', 'Additions jusqu’à 10', 'add', 5,
    () => { const a = alea(1, 9), b = alea(1, 10 - a); return questionCalculee(a, b, '+', 'add', 'add-10'); });
  push('add-20', 'Additions jusqu’à 20', 'add', 6,
    () => { const a = alea(2, 19), b = alea(1, 20 - a); return questionCalculee(a, b, '+', 'add', 'add-20'); });
  push('add-100', 'Additions jusqu’à 100', 'add', 8,
    () => { const a = alea(11, 89), b = alea(Math.max(1, 21 - a), 100 - a); return questionCalculee(a, b, '+', 'add', 'add-100'); });
  push('add-grand', 'Grandes additions', 'add', 10,
    () => questionCalculee(alea(50, 200), alea(20, 200), '+', 'add', 'add-grand'));

  push('sub-10', 'Soustractions jusqu’à 10', 'sub', 5,
    () => { const a = alea(2, 10), b = alea(1, a - 1); return questionCalculee(a, b, '−', 'sub', 'sub-10'); });
  push('sub-20', 'Soustractions jusqu’à 20', 'sub', 6,
    () => { const a = alea(6, 20), b = alea(1, a - 1); return questionCalculee(a, b, '−', 'sub', 'sub-20'); });
  push('sub-100', 'Soustractions jusqu’à 100', 'sub', 8,
    () => { const a = alea(21, 100), b = alea(2, a - 1); return questionCalculee(a, b, '−', 'sub', 'sub-100'); });
  push('sub-grand', 'Grandes soustractions', 'sub', 10,
    () => questionCalculee(alea(50, 300), alea(10, 200), '−', 'sub', 'sub-grand'));

  /* Tables de multiplication (chaque table est une compétence) */
  for (let n = 2; n <= 12; n++) {
    const ageMini = n <= 5 ? 7 : n <= 10 ? 8 : 11;
    push('mul-' + n, `Table de ${n}`, 'mul', ageMini,
      () => { const b = alea(2, age >= 11 ? 12 : 10); return questionCalculee(n, b, '×', 'mul', ['mul-' + n, 'mul-' + b]); });
  }
  /* Divisions : une compétence par diviseur */
  for (let n = 2; n <= 10; n++) {
    const ageMini = n <= 5 ? 8 : 10;
    push('div-' + n, `Divisions par ${n}`, 'div', ageMini,
      () => { const q = alea(2, age >= 11 ? 12 : 10); return questionCalculee(n * q, n, '÷', 'div', 'div-' + n); });
  }
  return liste;
}
const profMeta = key => profCatalogue(99).find(e => e.key === key) || null;

const Prof = {
  /* Lecture pure (ne crée pas de fiche vide) */
  lire(key) {
    return joueur.competences && joueur.competences[key] ? joueur.competences[key] : null;
  },
  /* Écriture : crée la fiche si besoin */
  fiche(key) {
    if (!joueur.competences) joueur.competences = {};
    return joueur.competences[key] || (joueur.competences[key] = { t: 0, r: 0, h: [], j: {}, der: 0 });
  },

  /* Enregistrer une réponse (skill = clé, tableau de clés, ou null) */
  enregistrer(skill, bon) {
    if (!skill) return;
    const cles = (Array.isArray(skill) ? skill : [skill]).filter(k => !k.endsWith('-x'));
    if (!cles.length) return;
    const jour = aujourdhui();
    cles.forEach(k => {
      const f = this.fiche(k);
      f.t++; if (bon) f.r++;
      f.h.push(bon ? 1 : 0);
      if (f.h.length > PROF_HIST_MAX) f.h.shift();
      f.der = Date.now();
      f.j[jour] = f.j[jour] || { t: 0, r: 0 };
      f.j[jour].t++; if (bon) f.j[jour].r++;
    });
    if (typeof sauverJoueur === 'function') sauverJoueur();
  },

  /* Note de maîtrise de 0 à 100 (null = pas assez de données) */
  note(key) {
    const f = this.lire(key);
    if (!f || !f.t) return null;
    let num = 0, den = 0;
    f.h.forEach((v, i) => { const w = 1 + i * 0.12; num += w * v; den += w; });
    const recente = den ? num / den : 0;
    const globale = f.r / f.t;
    return Math.round((0.72 * recente + 0.28 * globale) * 100);
  },

  niveau(key) {
    const f = this.lire(key);
    const n = this.note(key);
    if (!f || f.t < 3 || n === null) return { cle: 'nouvelle', lib: 'Pas encore travaillé', couleur: '#94a3b8' };
    if (n >= 90 && f.t >= 8) return { cle: 'maitrise', lib: 'Maîtrisé', couleur: '#16a34a' };
    if (n >= 75) return { cle: 'solide', lib: 'Solide', couleur: '#22c55e' };
    if (n >= 50) return { cle: 'apprentissage', lib: 'En apprentissage', couleur: '#f59e0b' };
    return { cle: 'faible', lib: 'À renforcer', couleur: '#ef4444' };
  },

  /* Compétences qui posent problème (note < 75, au moins 3 essais) */
  pointsFaibles(limite) {
    const cat = profCatalogue();
    return cat
      .map(e => ({ ...e, note: this.note(e.key), t: (this.lire(e.key) || { t: 0 }).t }))
      .filter(e => e.t >= 3 && e.note !== null && e.note < 75)
      .sort((x, y) => x.note - y.note)
      .slice(0, limite || 3);
  },

  /* Compétences pas encore découvertes par l'enfant (ordre du catalogue) */
  nouveautes(limite) {
    return profCatalogue().filter(e => { const f = this.lire(e.key); return !f || !f.t; }).slice(0, limite || 3);
  },

  /* Construction d'une session adaptative de `nb` questions */
  programme(nb) {
    nb = nb || 10;
    const cat = profCatalogue();
    const faibles = this.pointsFaibles(4);
    const nouvelles = this.nouveautes(3);
    const solides = cat
      .map(e => ({ ...e, note: this.note(e.key), t: (this.lire(e.key) || { t: 0 }).t }))
      .filter(e => e.t >= 3 && e.note !== null && e.note >= 80);

    // Pondération : les points faibles dominent la séance ; on n'y glisse
    // qu'au maximum 2 nouveautés et 2 révisions faciles pour ne pas les noyer.
    const vivier = [];
    faibles.forEach(e => { for (let i = 0; i < 8; i++) vivier.push(e); });
    melange(nouvelles).slice(0, 2).forEach(e => { for (let i = 0; i < 2; i++) vivier.push(e); });
    melange(solides).slice(0, 2).forEach(e => vivier.push(e));

    // Encore aucune réponse enregistrée (toute première séance) : diagnostic
    // équilibré qui couvre les grandes familles d'opérations de l'âge.
    const totalEssais = cat.reduce((s, e) => s + ((this.lire(e.key) || { t: 0 }).t), 0);
    if (!totalEssais) {
      const diag = [];
      const prendre = k => { const e = cat.find(c => c.key === k); if (e) diag.push(e); };
      prendre('add-10'); prendre('sub-10');
      if ((joueur.age || 7) >= 6) prendre('add-20');
      if ((joueur.age || 7) >= 7) { prendre('mul-2'); prendre('mul-3'); prendre('sub-20'); }
      if ((joueur.age || 7) >= 8) { prendre('mul-4'); prendre('mul-5'); prendre('div-2'); }
      if ((joueur.age || 7) >= 10) { prendre('div-6'); prendre('mul-6'); }
      while (diag.length < nb) diag.push(cat[diag.length % cat.length]);
      return melange(diag).slice(0, nb).map(e => e.gen());
    }

    const questions = [];
    let derniereCle = null;
    let gardesFous = 0;
    while (questions.length < nb && gardesFous++ < nb * 20) {
      const e = choix(melange(vivier));
      if (e.key === derniereCle && vivier.length > 1) continue;
      questions.push(e.gen());
      derniereCle = e.key;
    }
    return questions;
  },

  /* Phrase d'accroche affichée sur la carte d'accueil */
  accroche() {
    const faibles = this.pointsFaibles(1);
    if (faibles.length) return `On retravaille : ${faibles[0].lib} 💪`;
    if (!this.nouveautes(1).length) return 'Continue, tu es au top ! 🌟';
    if (!Object.keys(joueur.competences || {}).length) return '10 questions pour découvrir ton niveau';
    return 'Nouveaux défis adaptés à ton niveau ✨';
  },

  /* ---------- Espace parents ---------- */
  _toutesFiches() {
    return profCatalogue().map(e => ({ ...e, fiche: this.lire(e.key) })).filter(e => e.fiche && e.fiche.t);
  },
  /* Bilan agrégé par grande famille d'opérations */
  bilanDomaines() {
    const doms = {
      add: { lib: '➕ Additions', couleur: '#22c55e' },
      sub: { lib: '➖ Soustractions', couleur: '#f97316' },
      mul: { lib: '✖️ Multiplications', couleur: '#3b82f6' },
      div: { lib: '➗ Divisions', couleur: '#8b5cf6' }
    };
    const res = {};
    for (const [cle, meta] of Object.entries(doms)) {
      const fiches = this._toutesFiches().filter(e => e.dom === cle);
      let t = 0, r = 0, sommeNotes = 0, nNotes = 0;
      fiches.forEach(e => {
        t += e.fiche.t; r += e.fiche.r;
        const n = this.note(e.key); if (n !== null) { sommeNotes += n; nNotes++; }
      });
      res[cle] = { ...meta, t, r, note: nNotes ? Math.round(sommeNotes / nNotes) : null, travailles: fiches.length };
    }
    return res;
  },
  /* Activité globale des 7 derniers jours (toutes compétences confondues) */
  activiteSemaine() {
    const jours = [];
    const maintenant = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(maintenant); d.setDate(maintenant.getDate() - i);
      const clef = d.toISOString().slice(0, 10);
      let t = 0, r = 0;
      Object.values(joueur.competences || {}).forEach(f => {
        if (f.j && f.j[clef]) { t += f.j[clef].t; r += f.j[clef].r; }
      });
      const lib = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      jours.push({ clef, lib, t, r });
    }
    return jours;
  },
  /* Détail des compétences, trié du plus faible au plus fort */
  detailCompetences() {
    return this._toutesFiches()
      .map(e => ({ key: e.key, lib: e.lib, dom: e.dom, t: e.fiche.t, r: e.fiche.r, note: this.note(e.key), niveau: this.niveau(e.key) }))
      .sort((a, b) => (a.note === null ? 999 : a.note) - (b.note === null ? 999 : b.note));
  },
  /* Texte de recommandation pour les parents */
  recommandationParents() {
    const f = this.pointsFaibles(3);
    if (!this._toutesFiches().length) return 'Pas encore assez de parties jouées : lancez une ou deux sessions du Prof, le bilan se remplira tout seul.';
    if (f.length) return 'À retravailler en priorité : ' + f.map(e => `« ${e.lib} » (${e.note}%)`).join(', ') + '. Des séances courtes et régulières (10 minutes) donnent les meilleurs résultats.';
    return 'Aucune difficulté détectée sur les notions déjà travaillées : l\'enfant peut monter en difficulté ou découvrir de nouvelles compétences avec le Prof.';
  },

  /* Conseil après une session du Prof */
  conseil() {
    const f = this.pointsFaibles(1)[0];
    return f ? `💡 Le Prof te suggère de retravailler « ${f.lib} » : refais une petite série, c’est en s’entraînant que ça rentre !`
      : '🌟 Aucun point faible détecté : tu peux essayer un niveau plus difficile !';
  }
};

/* ---------- Lancement d'une session adaptative ---------- */
function lancerProf() {
  if (!joueur || !joueur.pseudo) return;
  JEU.dernier = { type: 'prof' };
  const questions = Prof.programme(10);
  moteurQuiz({
    titre: '🧠 Prof intelligent',
    questions,
    mode: 'prof',
    bonusXP: 15,
    prof: true
  });
}

/* ---------- Écran Espace parents ---------- */
function jaugeCompetence(note, couleur) {
  const n = note === null ? 0 : note;
  return `<div class="jauge"><div class="jauge-fill" style="width:${n}%;background:${couleur || '#14b8a6'}"></div>
    <span class="jauge-txt">${note === null ? '—' : note + '%'}</span></div>`;
}
function ecranParents() {
  const domaines = Prof.bilanDomaines();
  const semaine = Prof.activiteSemaine();
  const detail = Prof.detailCompetences();
  const totT = detail.reduce((s, d) => s + d.t, 0);
  const totR = detail.reduce((s, d) => s + d.r, 0);
  const globPct = totT ? Math.round(totR / totT * 100) : null;
  const maxJour = Math.max(1, ...semaine.map(j => j.t));
  const faibles = detail.filter(d => d.t >= 3 && d.note !== null && d.note < 75).slice(0, 5);
  const forts = detail.filter(d => d.t >= 3 && d.note !== null && d.note >= 80).slice(-5).reverse();

  const ligneDomaine = ([cle, d]) => `
    <div class="bilan-domaine">
      <div class="bd-tete"><b>${d.lib}</b><span>${d.t ? d.t + ' essais' : 'pas encore travaillé'}</span></div>
      ${d.note === null ? '<div class="petit-texte">Aucune donnée pour le moment.</div>' :
        jaugeCompetence(d.note, d.couleur)}
    </div>`;

  afficher(entetePage('👨\u200d👩\u200d👧 Bilan parents', 'reglages') + `
    <div class="carte">
      <div class="section-titre" style="margin-top:0">📊 Vue d'ensemble</div>
      <div class="grille-stats">
        <div class="stat-puce"><b>${totT}</b>réponses enregistrées</div>
        <div class="stat-puce"><b>${globPct === null ? '—' : globPct + '%'}</b>de réussite globale</div>
        <div class="stat-puce"><b>${detail.filter(d => d.t >= 3).length}</b>compétences évaluées</div>
        <div class="stat-puce"><b>${forts.length}</b>bien maîtrisées</div>
      </div>
      <div class="bilan-domaines mt">${Object.entries(domaines).map(ligneDomaine).join('')}</div>
    </div>

    <div class="carte mt">
      <div class="section-titre" style="margin-top:0">📅 Cette semaine</div>
      <div class="semaine-graphe">
        ${semaine.map(j => `
          <div class="jour-barre" title="${j.t} réponses, ${j.r} justes">
            <div class="jb-colle">
              <div class="jb-boite" style="height:${Math.round(j.t / maxJour * 94)}px">
                <div class="jb-justes" style="height:${j.t ? Math.round(j.r / j.t * 100) : 0}%"></div>
              </div>
            </div>
            <span class="jb-jour">${j.lib}</span>
            <span class="jb-n">${j.t || ''}</span>
          </div>`).join('')}
      </div>
      <p class="petit-texte">En foncé : réponses justes. Toutes les réponses des quiz et du Prof comptent.</p>
    </div>

    <div class="carte mt">
      <div class="section-titre" style="margin-top:0">💪 À renforcer</div>
      ${faibles.length ? faibles.map(d => `
        <div class="bilan-ligne">
          <span class="bl-lib">${d.lib} <span class="bl-niv" style="color:${d.niveau.couleur}">${d.niveau.lib}</span></span>
          ${jaugeCompetence(d.note, d.niveau.couleur)}
        </div>`).join('') : '<p class="petit-texte">Aucune difficulté détectée pour le moment 🌟</p>'}
    </div>

    <div class="carte mt">
      <div class="section-titre" style="margin-top:0">🌟 Bien maîtrisé</div>
      ${forts.length ? forts.map(d => `
        <div class="bilan-ligne">
          <span class="bl-lib">${d.lib} <span class="bl-niv" style="color:${d.niveau.couleur}">${d.niveau.lib}</span></span>
          ${jaugeCompetence(d.note, d.niveau.couleur)}
        </div>`).join('') : '<p class="petit-texte">Jouez quelques parties pour faire apparaître les points forts.</p>'}
    </div>

    <div class="carte mt">
      <div class="section-titre" style="margin-top:0">🧠 Conseil du Prof</div>
      <p>${Prof.recommandationParents()}</p>
      <button class="btn btn-grand btn-principal mt" data-act="prof-lancer">Lancer une séance du Prof</button>
    </div>
    <p class="petit-texte center mt">🔒 Ces données restent uniquement sur cet appareil : rien n'est envoyé sur internet.</p>
    ${navHTML('')}`);
}
