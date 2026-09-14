/* ============================================================
   MATH QUEST v2 — audio.js
   Effets sonores variés, musique de fond et VOIX d'encouragement
   (Web Audio API + synthèse vocale du navigateur, aucun fichier)
   ============================================================ */
'use strict';

const AudioMX = {
  ctx: null,
  /* Migration d'anciennes préférences (son/musique) vers les 3 réglages */
  prefs: (() => {
    const anciennes = stockage.get('mq_prefs', null);
    if (anciennes && 'effets' in anciennes) return { voixType: 'fille', ...anciennes };
    return {
      effets: anciennes ? anciennes.son !== false : true,
      voix: true,
      voixType: 'fille',
      musique: anciennes ? anciennes.musique !== false : true
    };
  })(),
  musiqueTimer: null,
  prochaineNote: 0,
  tempo: 108,
  derniereVoix: 0,
  voixFR: null,
  voixFilles: null,
  voixGarcons: null,
  _paroleJeton: 0,

  _sauver() { stockage.set('mq_prefs', this.prefs); },
  _assurer() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  /* Appelé au premier geste (clic) : débloque le son + la parole */
  deverrouiller() {
    this._assurer();
    this._choisirVoix();
    if ('speechSynthesis' in window) {
      // Chrome charge les voix de façon asynchrone
      window.speechSynthesis.onvoiceschanged = () => this._choisirVoix();
    }
    if (this.prefs.musique) this.demarrerMusique();
    this._maintenirVoix();
  },
  /* iOS coupe la parole au bout de quelques secondes : un petit resume()
     régulier empêche la synthèse vocale de se figer. */
  _maintenirVoix() {
    if (this._keepAlive || !('speechSynthesis' in window)) return;
    this._keepAlive = setInterval(() => {
      if (this.prefs.voix) { try { window.speechSynthesis.resume(); } catch {} }
    }, 6000);
  },

  /* ---------- Réglages ---------- */
  setEffets(v) { this.prefs.effets = v; this._sauver(); },
  setVoix(v) {
    this.prefs.voix = v; this._sauver();
    if (!v && 'speechSynthesis' in window) try { window.speechSynthesis.cancel(); } catch {}
  },
  setMusique(v) {
    this.prefs.musique = v; this._sauver();
    if (v) { this._assurer(); this.demarrerMusique(); } else this.arreterMusique();
  },
  /* Muet général (bouton haut de l'accueil) */
  toutActif() { return this.prefs.effets && this.prefs.voix && this.prefs.musique; },
  basculerGlobal() {
    const on = !this.toutActif();
    this.prefs.effets = on; this.prefs.voix = on; this.prefs.musique = on;
    if (on) { this._assurer(); this.demarrerMusique(); }
    else { this.arreterMusique(); if ('speechSynthesis' in window) try { window.speechSynthesis.cancel(); } catch {} }
    this._sauver();
    return on;
  },

  /* ---------- Notes ---------- */
  _note(freq, debut, duree, type = 'triangle', volume = .13) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, debut);
    gain.gain.setValueAtTime(.0001, debut);
    gain.gain.exponentialRampToValueAtTime(volume, debut + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, debut + duree);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(debut); osc.stop(debut + duree + .03);
  },
  _glisse(f1, f2, debut, duree, type = 'sine', volume = .09) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, debut);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), debut + duree);
    gain.gain.setValueAtTime(volume, debut);
    gain.gain.exponentialRampToValueAtTime(.0001, debut + duree);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(debut); osc.stop(debut + duree + .03);
  },
  /* une suite de notes [freq, decalage, duree, type, volume] */
  _suite(notes) {
    const ctx = this._assurer();
    if (!ctx) return;
    const t = ctx.currentTime;
    notes.forEach(([f, dec, du, type, vol]) => this._note(f, t + dec, du, type || 'triangle', vol || .13));
  },

  sfx(genre, combo = 0) {
    if (!this.prefs.effets) return;
    const ctx = this._assurer();
    if (!ctx) return;
    const hausse = 1 + Math.min(combo, 10) * .025;
    // Plusieurs variantes mélodiques pour éviter la répétition
    const jinglesBonne = [
      [[523, 0, .09], [659, .08, .09], [784, .16, .14]],
      [[587, 0, .09], [740, .08, .09], [880, .16, .14]],
      [[659, 0, .09], [784, .08, .09], [988, .16, .14]],
      [[523, 0, .08], [784, .08, .12], [1047, .18, .16]]
    ];
    switch (genre) {
      case 'clic':
        this._suite([[560 + alea(-40, 40), 0, .05, 'square', .045]]); break;
      case 'bonne':
        this._suite(jinglesBonne[alea(0, jinglesBonne.length - 1)].map(
          ([f, d, du]) => [f * hausse, d, du]));
        break;
      case 'faute':
        this._suite([[330, 0, .12, 'sine', .1], [247, .12, .18, 'sine', .1]]); break;
      case 'tick':
        this._suite([[880, 0, .04, 'square', .05]]); break;
      case 'compte':
        this._suite([[440, 0, .08], [440, .18, .08], [660, .38, .22]]); break;
      case 'etoile':
        this._suite([[784, 0, .09], [988, .09, .09], [1175, .18, .11], [1568, .27, .2]]); break;
      case 'niveau':
        this._suite([[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .28]]); break;
      case 'piece':
        this._suite([[988, 0, .05, 'square', .09], [1319, .06, .15, 'square', .09]]); break;
      case 'achat':
        this._suite([[659, 0, .09], [784, .08, .09], [988, .16, .09], [1319, .24, .18]]); break;
      case 'whoosh':
        this._glisse(200, 950, ctx.currentTime, .25, 'sine', .06); break;
      case 'taupe':
        this._suite([[523, 0, .05, 'square', .12], [784, .05, .06, 'square', .1], [1047, .11, .09, 'square', .08]]); break;
      case 'boss':
        this._suite([[392, 0, .2, 'sawtooth', .05], [392, .18, .2, 'sawtooth', .05], [523, .36, .18], [659, .5, .18], [784, .64, .3]]); break;
      case 'debloque':
        this._suite([[523, 0, .08], [659, .08, .08], [784, .16, .08], [1047, .24, .1], [1319, .32, .22]]); break;
      case 'jour':
        this._suite([[587, 0, .09], [740, .09, .09], [880, .18, .24]]); break;
      case 'ferme':
        this._glisse(500, 260, ctx.currentTime, .15, 'sine', .05); break;
      default:
        this._suite([[440, 0, .1]]);
    }
  },

  /* ---------- VOIX d'encouragement (voix d'enfant) ---------- */
  lignes: {
    bonne: ['Bravo !', 'Super !', 'Génial !', 'Bien joué !', 'Exact !', 'Ouais !', 'Top !', 'Tu déchires !', 'Incroyable !', 'Quel champion !'],
    combo: ['Quel combo !', 'Tu es en feu !', 'Imbattable !', 'Continue comme ça !', 'Tu es trop fort !'],
    faute: ['Réessaie !', 'Pas grave !', 'Encore un effort !', 'Tu vas y arriver !', 'Presque !'],
    victoire: ['Victoire !', 'Tu as gagné !', 'Magnifique !', 'Tu es trop fort !', 'Quelle victoire !'],
    bravo: ['Bravo, niveau terminé !', 'Parfait, tu es un champion !', 'Trop bien joué !'],
    encouragement: ['Bien joué, continue !', 'Tu progresses, bravo !', 'Ne lâche rien !'],
    badge: ['Nouveau badge !', 'Tu as gagné un badge !'],
    accueil: ['Bonjour et bienvenue !', 'Content de te revoir !', 'Youpi, on joue ensemble !'],
    boss: ['Victoire ! Tu as battu le boss !']
  },
  _choisirVoix() {
    if (!('speechSynthesis' in window)) return;
    const toutes = window.speechSynthesis.getVoices();
    const fr = toutes.filter(v => /^fr/i.test(v.lang));
    const nom = v => (v.name || '').toLowerCase();
    // Noms de voix françaises les plus souvent rencontrés (Android/iOS/Chrome)
    const FEMININS = ['enfant','child','kid','girl','fille','amélie','amelie','audrey','caroline',
      'denise','marie','virginie','céline','celine','julie','marine','manon','camille','chloé','chloe',
      'léa','lea','eloise','éloïse','anna','hana','google français','femme','female','woman','samantha','amandine','juliette'];
    const MASCULINS = ['thomas','henri','paul','mathieu','nicolas','julien','antoine','rémi','remi',
      'gaël','gael','sylvain','homme','male','boy','garcon','garçon','maxime','gabriel','louis','arthur'];
    const enfant = fr.find(v => /enfant|child|kid/i.test(nom(v)));
    this.voixFilles = enfant || fr.find(v => FEMININS.some(m => nom(v).includes(m)));
    this.voixGarcons = fr.find(v => MASCULINS.some(m => nom(v).includes(m)));
    this.voixFR = fr.find(v => /fr[-_]fr/i.test(v.lang)) || fr[0] || null;
  },
  setVoixType(t) {
    this.prefs.voixType = t === 'garcon' ? 'garcon' : 'fille';
    this._sauver();
    this.derniereVoix = 0;
    if (this.prefs.voix) this.parler(t === 'garcon' ? 'Salut, on joue ensemble !' : 'Coucou, on joue ensemble !');
  },
  parler(texte) {
    if (!this.prefs.voix || !('speechSynthesis' in window)) return;
    try {
      const ss = window.speechSynthesis;
      this._choisirVoix(); // certaines plateformes chargent les voix très tard
      const genre = this.prefs.voixType === 'garcon' ? 'garcon' : 'fille';
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR';
      const choisie = genre === 'garcon'
        ? (this.voixGarcons || this.voixFilles || this.voixFR)
        : (this.voixFilles || this.voixGarcons || this.voixFR);
      if (choisie) u.voice = choisie;
      // Si la voix choisie est DÉJÀ une voix d'enfant, on la garde presque
      // naturelle ; sinon on remonte légèrement la hauteur pour la rajeunir,
      // avec une petite variation à chaque phrase (rendu vivant, pas robotique).
      const dejaEnfant = choisie && /enfant|child|kid/i.test(choisie.name || '');
      if (dejaEnfant) {
        u.pitch = genre === 'garcon' ? 1.02 + alea(-1, 2) / 40 : 1.06 + alea(-1, 2) / 40;
      } else if (genre === 'garcon') {
        u.pitch = 1.22 + alea(-1, 3) / 40;   // ~1.19–1.30
      } else {
        u.pitch = 1.42 + alea(-2, 3) / 40;   // ~1.37–1.50
      }
      u.rate = 1.0 + alea(-2, 2) / 120;      // ~0.98–1.02
      u.volume = 1;
      // Anti-bug Chrome/Android : un cancel() immédiatement suivi de speak()
      // fait parfois avaler la phrase → on décale de 60 ms et on annule
      // l'envoi si une phrase plus récente a pris la place.
      const jeton = ++this._paroleJeton;
      ss.cancel();
      setTimeout(() => {
        if (jeton !== this._paroleJeton) return;
        try { ss.resume(); ss.speak(u); } catch {}
      }, 60);
    } catch {}
  },
  testerVoix() {
    this.derniereVoix = 0;
    const genre = this.prefs.voixType === 'garcon' ? 'garcon' : 'fille';
    this.parler(genre === 'garcon'
      ? choix(['Bravo, continue comme ça !', 'Super, tu es trop fort !'])
      : choix(['Bravo, tu déchires !', 'Victoire ! Tu es la meilleure !']));
  },
  voix(categorie, force = false) {
    if (!this.prefs.voix) return;
    const maintenant = Date.now();
    if (!force && maintenant - this.derniereVoix < 3200) return;
    this.derniereVoix = maintenant;
    const liste = this.lignes[categorie];
    if (liste) this.parler(choix(liste));
  },

  /* ---------- Musique de fond originale ---------- */
  demarrerMusique() {
    const ctx = this._assurer();
    if (!ctx || !this.prefs.musique || this.musiqueTimer) return;
    const P = n => 440 * Math.pow(2, (n - 69) / 12);
    const LEAD = [
      72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 76, 72, 74, 76, 0, 72,
      72, 76, 79, 76, 72, 76, 79, 84, 87, 84, 79, 76, 74, 72, 0, 0
    ];
    const BASS = [48, 0, 48, 0, 53, 0, 53, 0, 55, 0, 55, 0, 50, 0, 50, 0];
    const pas = 60 / this.tempo / 2;
    let pasIndex = 0;
    let prochaine = ctx.currentTime + .1;
    const boucle = () => {
      if (!this.ctx) return;
      const maintenant = this.ctx.currentTime;
      while (prochaine < maintenant + .35) {
        const lead = LEAD[pasIndex % LEAD.length];
        const basse = BASS[pasIndex % BASS.length];
        if (lead) this._note(P(lead), prochaine, pas * 1.6, 'triangle', .035);
        if (basse) this._note(P(basse), prochaine, pas * 1.7, 'sine', .04);
        prochaine += pas;
        pasIndex++;
      }
    };
    this.musiqueTimer = setInterval(boucle, 100);
    boucle();
  },
  arreterMusique() {
    if (this.musiqueTimer) { clearInterval(this.musiqueTimer); this.musiqueTimer = null; }
  }
};
const sfx = (genre, combo = 0) => AudioMX.sfx(genre, combo);
