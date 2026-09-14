/* ============================================================
   MATH QUEST v2 — fx.js
   Effets visuels : confettis, particules, textes flottants,
   toasts, modales, transition d'écran
   ============================================================ */
'use strict';

const root = $('#root');

/* Affiche un écran avec une petite animation d'entrée.
   rester=true : simple mise à jour du jeu en cours (PAS d'animation,
   PAS de remontée en haut de page) — indispensable pour les grilles
   tactiles type Coloriage/Sudoku où l'on tape case après case. */
function afficher(html, rester = false) {
  root.innerHTML = html;
  if (!rester) {
    root.style.animation = 'none';
    void root.offsetWidth;
    root.style.animation = '';
    window.scrollTo(0, 0);
  }
}

/* ---------- Confettis (canvas) ---------- */
const canvas = $('#confetti');
const ctxCanvas = canvas.getContext('2d');
let confettis = [];
function redimCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', redimCanvas); redimCanvas();
function pluieConfettis(n = 90) {
  const couleurs = ['#8b5cf6', '#ec4899', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#ffffff'];
  for (let i = 0; i < n; i++) {
    confettis.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 80,
      r: 5 + Math.random() * 7, c: choix(couleurs),
      vy: 2.4 + Math.random() * 3, vx: -2 + Math.random() * 4,
      rot: Math.random() * 6, vr: -.2 + Math.random() * .4
    });
  }
}
function explosion(x, y, n = 14, couleur = '#22c55e') {
  const couleurs = [couleur, '#facc15', '#ffffff', '#ec4899'];
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vitesse = 2 + Math.random() * 4;
    confettis.push({
      x, y, r: 4 + Math.random() * 5, c: choix(couleurs),
      vy: -Math.sin(angle) * vitesse, vx: Math.cos(angle) * vitesse,
      rot: 0, vr: (Math.random() - .5) * .5, vie: 45
    });
  }
}
(function animeConfettis() {
  ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
  confettis = confettis.filter(p => p.y < canvas.height + 30 && (p.vie === undefined || p.vie-- > 0));
  confettis.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.vie !== undefined) { p.vy += .12; p.vx *= .98; }
    p.rot += p.vr;
    ctxCanvas.save(); ctxCanvas.translate(p.x, p.y); ctxCanvas.rotate(p.rot);
    ctxCanvas.fillStyle = p.c; ctxCanvas.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6);
    ctxCanvas.restore();
  });
  requestAnimationFrame(animeConfettis);
})();

/* ---------- Texte flottant (+10, 🪙…) ---------- */
function texteFlottant(x, y, texte, couleur = '#f59e0b') {
  const el = document.createElement('div');
  el.className = 'flottant';
  el.textContent = texte;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = couleur;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function flottantSurElement(el, texte, couleur) {
  const r = el.getBoundingClientRect();
  texteFlottant(r.left + r.width / 2, r.top + 10, texte, couleur);
}

/* ---------- Gros feedback central ---------- */
function afficherFeedback(texte, bon) {
  const div = document.createElement('div');
  div.className = `feedback ${bon ? 'ok' : 'ko'} show`;
  div.textContent = texte;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 850);
}

/* ---------- Toast ---------- */
let timerToast = null;
function dire(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- Modales ---------- */
const superposition = $('#superposition');
function modale(html) {
  superposition.innerHTML = `<div class="modale">${html}</div>`;
  superposition.hidden = false;
}
function fermerModale() { superposition.hidden = true; superposition.innerHTML = ''; }
superposition.addEventListener('click', e => { if (e.target === superposition) fermerModale(); });

/* ---------- Rendu des étoiles ---------- */
function chapeauEtoiles(n, classeBase = 'et') {
  return [1, 2, 3].map(i =>
    `<span class="${classeBase} ${i <= n ? 'gagnee' : ''}">⭐</span>`).join('');
}
function animeEtoiles(selecteur = '.etoiles-resultat .et') {
  $$(selecteur).forEach((e, i) => {
    if (e.classList.contains('gagnee')) {
      setTimeout(() => { e.style.animation = 'pop .4s'; sfx('etoile'); }, 250 + i * 330);
    }
  });
}

/* ---------- Avatar avec accessoire ---------- */
function avatarHTML(emoji, accessoire, taille = '', type = '') {
  // Un déguisement ('visage') remplace entièrement la tête ; les autres
  // accessoires se posent dessus (chapeau) ou en badge en bas à droite.
  if (accessoire && type === 'visage') {
    return `<span class="avatar-wrap ${taille} deguise"><span class="av">${accessoire}</span></span>`;
  }
  return `<span class="avatar-wrap ${taille}"><span class="av">${emoji}</span>${
    accessoire ? `<span class="accessoire ${type === 'badge' ? 'acc-badge' : ''}">${accessoire}</span>` : ''}</span>`;
}
