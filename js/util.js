/* ============================================================
   MATH QUEST v2 — util.js
   Petits outils partagés (DOM, hasard, stockage, minuteries)
   ============================================================ */
'use strict';

const $  = (sel, base = document) => base.querySelector(sel);
const $$ = (sel, base = document) => [...base.querySelectorAll(sel)];
const alea = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choix = tableau => tableau[Math.floor(Math.random() * tableau.length)];
function melange(tableau) {
  const t = [...tableau];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
const echapper = texte => String(texte).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const stockage = {
  get(c, def) { try { const v = localStorage.getItem(c); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(c, v) { try { localStorage.setItem(c, JSON.stringify(v)); } catch {} },
  del(c) { try { localStorage.removeItem(c); } catch {} }
};

/* Minuteries qui sont arrêtées dès qu'on change d'écran */
const MINUTERIES = [];
const apres = (fn, ms) => { const id = setTimeout(fn, ms); MINUTERIES.push(id); return id; };
const toutesLes = (fn, ms) => { const id = setInterval(fn, ms); MINUTERIES.push(id); return id; };
function toutArreter() {
  MINUTERIES.forEach(clearTimeout);
  MINUTERIES.forEach(clearInterval);
  MINUTERIES.length = 0;
}

/* Dates */
const aujourdhui = () => new Date().toISOString().slice(0, 10);
function hierStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
/* Petit générateur pseudo-aléatoire déterministe (graine = date) */
function graineChaine(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function melangeGraine(tableau, rng) {
  const t = [...tableau];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}
const dateLisible = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
