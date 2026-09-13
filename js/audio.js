/* ============================================================
   MATH QUEST v2 — audio.js
   Effets sonores et musique générés avec Web Audio API
   (aucun fichier à télécharger)
   ============================================================ */
'use strict';

const AudioMX = {
  ctx: null,
  prefs: stockage.get('mq_prefs', { son: true, musique: true }),
  musiqueTimer: null,
  prochaineNote: 0,
  tempo: 108,

  _assurer() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  /* Tout premier geste : débloque le son et démarre la musique */
  deverrouiller() {
    this._assurer();
    if (this.prefs.musique) this.demarrerMusique();
  },
  setSon(actif) { this.prefs.son = actif; stockage.set('mq_prefs', this.prefs); },
  setMusique(actif) {
    this.prefs.musique = actif; stockage.set('mq_prefs', this.prefs);
    if (actif) { this._assurer(); this.demarrerMusique(); } else this.arreterMusique();
  },

  _note(freq, debut, duree, type = 'triangle', volume = .14) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, debut);
    gain.gain.setValueAtTime(.0001, debut);
    gain.gain.exponentialRampToValueAtTime(volume, debut + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, debut + duree);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(debut); osc.stop(debut + duree + .03);
  },
  _glissement(f1, f2, debut, duree, type = 'sine', volume = .1) {
    const ctx = this.ctx;
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

  sfx(genre, combo = 0) {
    if (!this.prefs.son) return;
    const ctx = this._assurer();
    if (!ctx) return;
    const t = ctx.currentTime;
    const N = (f, i, d, type, v) => this._note(f, t + i, d, type || 'triangle', v || .14);
    const hausse = 1 + Math.min(combo, 8) * .03; // les bonnes séries montent en hauteur
    switch (genre) {
      case 'clic':    N(500, 0, .06, 'square', .05); break;
      case 'bonne':
        N(523 * hausse, 0, .1); N(659 * hausse, .09, .1); N(784 * hausse, .18, .16); break;
      case 'faute':   this._glissement(240, 130, t, .25, 'sawtooth', .09); break;
      case 'etoile':  N(784, 0, .09); N(988, .09, .09); N(1175, .18, .12); N(1568, .27, .2); break;
      case 'niveau':  [523, 659, 784, 1047].forEach((f, i) => N(f, i * .11, .22)); break;
      case 'piece':   N(988, 0, .06, 'square', .09); N(1319, .07, .16, 'square', .09); break;
      case 'achat':   [659, 784, 988, 1319].forEach((f, i) => N(f, i * .07, .14)); break;
      case 'whoosh':  this._glissement(200, 900, t, .25, 'sine', .07); break;
      case 'tick':    N(880, 0, .04, 'square', .05); break;
      case 'taupe':   N(330, 0, .07, 'square', .12); this._glissement(700, 200, t, .12, 'sine', .08); break;
      case 'boss':    [392, 392, 523, 659, 784].forEach((f, i) => N(f, i * .12, .25, 'sawtooth', .07)); break;
      case 'debloque':[523, 659, 784, 1047, 1319].forEach((f, i) => N(f, i * .08, .2)); break;
      case 'jour':    N(587, 0, .1); N(740, .1, .1); N(880, .2, .25); break;
      default:        N(440, 0, .1);
    }
  },

  /* ---------- Musique de fond : boucle joyeuse (lead + basse) ---------- */
  demarrerMusique() {
    const ctx = this._assurer();
    if (!ctx || this.musiqueTimer) return;
    const P = n => 440 * Math.pow(2, (n - 69) / 12);
    // Mélodie originale (notes MIDI), 32 pas
    const LEAD = [
      72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 76, 72, 74, 76, 0, 72,
      72, 76, 79, 76, 72, 76, 79, 84, 87, 84, 79, 76, 74, 72, 0, 0
    ];
    const BASS = [48, 0, 48, 0, 53, 0, 53, 0, 55, 0, 55, 0, 50, 0, 50, 0];
    const pas = 60 / this.tempo / 2; // durée d'un pas
    let pasIndex = 0;
    let prochaine = ctx.currentTime + .1;

    const boucle = () => {
      if (!this.ctx) return;
      const maintenant = this.ctx.currentTime;
      while (prochaine < maintenant + .35) {
        const lead = LEAD[pasIndex % LEAD.length];
        const basse = BASS[pasIndex % BASS.length];
        if (lead) this._note(P(lead), prochaine, pas * 1.6, 'triangle', .04);
        if (basse) this._note(P(basse), prochaine, pas * 1.7, 'sine', .045);
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
/* Alias court utilisé partout */
const sfx = (genre, combo = 0) => AudioMX.sfx(genre, combo);
