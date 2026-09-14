/* ============================================================
   MATH QUEST v3.0 — aventure.js
   Mode Aventure : carte des 5 mondes, nœuds, coffres, boss
   ============================================================ */
'use strict';

/* Liste aplatie de tous les nœuds (avec leur monde) */
function tousNoeudsAventure() {
  return AVENTURE.flatMap(m => m.noeuds.map(n => ({ ...n, monde: m.id })));
}

/* Étoiles obtenues sur un nœud (0, 1, 2 ou 3 ; les coffres valent 3 une fois ouverts) */
function etoilesNoeud(n) {
  if (!joueur || !joueur.aventure) return 0;
  if (n.type === 'coffre') return joueur.aventure.coffres.includes(n.id) ? 3 : 0;
  const v = joueur.aventure.noeuds[n.id];
  if (v) return v;
  if (n.type === 'niveau') return joueur.etoiles[n.niveau] || 0; // reprise d'une ancienne sauvegarde
  return 0;
}
const noeudFait = n => etoilesNoeud(n) > 0;
let aventurePositionnee = false;

/* Un nœud de jeu est ouvert si le nœud de jeu précédent est fait.
   Raccourci d'âge : le 1er nœud des mondes « ados » (ageMin > 0) s'ouvre
   selon l'âge, sans finir les mondes précédents.
   Les coffres sont optionnels : ils ne bloquent jamais le chemin. */
function noeudOuvert(indexGlobal) {
  const plat = tousNoeudsAventure();
  if (indexGlobal <= 0) return true;
  const n = plat[indexGlobal];

  // Coffre : ouvert dès que le nœud immédiatement avant lui est fait
  if (n.type === 'coffre') return indexGlobal > 0 && noeudFait(plat[indexGlobal - 1]);

  // 1er nœud de jeu d'un monde à accès par âge (espace ados, île champions)
  const mi = AVENTURE.findIndex(m => m.id === n.monde);
  const jeuxAvantDansMonde = AVENTURE[mi].noeuds
    .filter(x => x.type !== 'coffre')
    .findIndex(x => x.id === n.id);
  if (jeuxAvantDansMonde === 0 && AVENTURE[mi].ageMin > 0 && joueur.age >= AVENTURE[mi].ageMin) {
    return true;
  }

  // Sinon : le nœud de jeu précédent (tous mondes confondus) doit être fait
  for (let k = indexGlobal - 1; k >= 0; k--) {
    if (plat[k].type === 'coffre') continue;
    return noeudFait(plat[k]);
  }
  return true;
}
function mondeFini(i) {
  if (i < 0 || !AVENTURE[i]) return false;
  return AVENTURE[i].noeuds
    .filter(n => n.type !== 'coffre')
    .every(noeudFait);
}
function aventureFinie() {
  return AVENTURE.every((_, i) => mondeFini(i));
}
function tousCoffresPris() {
  return AVENTURE.flatMap(m => m.noeuds).filter(n => n.type === 'coffre')
    .every(n => joueur.aventure.coffres.includes(n.id));
}
/* Premier nœud jouable non terminé (pour le bouton Continuer).
   Un joueur qui n'a encore rien fait est guidé vers le monde
   correspondant à son âge (les ados/adultes ne commencent pas à la forêt). */
function prochainNoeud() {
  const plat = tousNoeudsAventure();
  const jeuPlat = plat.filter(n => n.type !== 'coffre');
  const aucunProgres = jeuPlat.every(n => !noeudFait(n));
  if (aucunProgres) {
    let mondeDepart = 0;
    AVENTURE.forEach((m, i) => { if (m.ageMin > 0 && joueur.age >= m.ageMin) mondeDepart = i; });
    return AVENTURE[mondeDepart].noeuds.find(n => n.type !== 'coffre');
  }
  for (let i = 0; i < plat.length; i++) {
    if (plat[i].type !== 'coffre' && !noeudFait(plat[i]) && noeudOuvert(i)) return plat[i];
  }
  return null;
}

function libelleNoeud(n) {
  if (n.type === 'niveau') {
    const x = NIVEAUX.find(z => z.id === n.niveau);
    return { emoji: x.emoji, nom: x.nom, sous: x.sous };
  }
  if (n.type === 'jeu') {
    const m = MODES.find(z => z.id === n.mode);
    return { emoji: m.emoji, nom: m.nom, sous: m.sous };
  }
  if (n.type === 'boss') {
    const b = BOSS_AVENTURE[n.boss - 1];
    return { emoji: b.emoji, nom: b.nom, sous: 'Combat de boss ⚔️' };
  }
  return { emoji: '🧰', nom: 'Coffre au trésor', sous: 'Touche pour l\'ouvrir' };
}

/* ---------- Lancement d'un nœud ---------- */
function lancerNoeud(id) {
  const plat = tousNoeudsAventure();
  const gi = plat.findIndex(x => x.id === id);
  const n = plat[gi];
  if (!n) return;
  if (!noeudOuvert(gi)) { sfx('ferme'); dire('🔒 Termine l\'étape précédente sur la carte !'); return; }

  if (n.type === 'coffre') return ouvrirCoffre(n);

  toutArreter();
  JEU.aventureId = id;
  if (n.type === 'niveau') return lancerNiveau(n.niveau, { aventureId: id });
  if (n.type === 'boss') return lancerBossAventure(n.boss, id);
  JEU.dernier = { type: 'mode', mode: n.mode };
  return ouvrirMode(n.mode);
}

/* ---------- Coffres ---------- */
function ouvrirCoffre(n) {
  if (joueur.aventure.coffres.includes(n.id)) { dire('Ce coffre est déjà vide ! 🧰'); return; }
  joueur.aventure.coffres.push(n.id);
  ajouterPieces(n.pieces);
  const badges = verifierBadges();
  sauverJoueur();
  pluieConfettis(140); sfx('jour');
  AudioMX.voix('victoire', true);
  modale(`
    <div class="m-emoji">🎁</div>
    <h3>Un trésor !</h3>
    <p>Tu as trouvé un coffre caché sur la carte.</p>
    <div class="m-recomp">+${n.pieces} 🪙 pièces</div>
    ${badges.length ? `<p class="petit-texte">🏅 Et un nouveau badge !</p>` : ''}
    <button class="btn btn-grand btn-orange" data-act="ferme-modale">Youpi ! 🎉</button>`);
  if ($('#root').innerHTML.includes('Carte Aventure')) ecranAventure();
}

/* ---------- Écran : la carte ---------- */
function ecranAventure() {
  if (!joueur) return ecranBienvenue();
  if (!joueur.aventure) joueur.aventure = { noeuds: {}, coffres: [] };
  const plat = tousNoeudsAventure();
  let gi = -1;
  const totalJouables = plat.filter(n => n.type !== 'coffre').length;
  const faitsTotal = plat.filter(n => n.type !== 'coffre').filter(noeudFait).length;

  const mondesHTML = AVENTURE.map((monde, mi) => {
    const jouables = monde.noeuds.filter(n => n.type !== 'coffre');
    const faits = jouables.filter(noeudFait).length;
    const pct = Math.round(faits / jouables.length * 100);
    const premierIndex = plat.findIndex(x => x.id === monde.noeuds[0].id);
    const mondeOuvert = noeudOuvert(premierIndex) || faits > 0 || mondeFini(mi - 1);

    const noeudsHTML = monde.noeuds.map((n, k) => {
      gi++;
      const ouvert = noeudOuvert(gi);
      const fait = noeudFait(n);
      const etoiles = etoilesNoeud(n);
      const lib = libelleNoeud(n);
      const cote = k % 2 === 0 ? 'gauche' : 'droite';
      let typeClasse = 'avt-jeu';
      if (n.type === 'boss') typeClasse = 'avt-boss';
      if (n.type === 'coffre') typeClasse = 'avt-coffre';
      if (n.type === 'niveau') typeClasse = 'avt-niveau';
      const etat = !ouvert ? 'verrouille' : fait ? 'fait' : 'ouvert';
      const cercle = n.type === 'coffre'
        ? (fait ? '✅' : (ouvert ? '🧰' : '🔒'))
        : (fait ? lib.emoji : (ouvert ? lib.emoji : '🔒'));
      return `
        <div class="avt-ligne ${cote}">
          <button class="avt-noeud ${typeClasse} ${etat}" data-act="lancer-noeud" data-id="${n.id}">
            <span class="avt-cercle">${cercle}</span>
            <span class="avt-legende">
              <span class="avt-nom">${ouvert || fait ? lib.nom : '???'}</span>
              <span class="avt-sous">${ouvert || fait ? lib.sous : 'Étape verrouillée'}</span>
              ${n.type !== 'coffre' ? `<span class="avt-etoiles">${'⭐'.repeat(etoiles)}${'☆'.repeat(3 - etoiles)}</span>` : '<span class="avt-etoiles">🎁</span>'}
            </span>
          </button>
        </div>`;
    }).join('');

    return `
      <section class="avt-monde ${mondeOuvert ? '' : 'monde-verrouille'}" id="monde-${monde.id}">
        <div class="avt-bandeau ${mi >= 3 ? 'sombre' : ''}" style="background:${monde.ambiance}">
          <span class="avt-monde-emoji">${mondeOuvert || faits ? monde.emoji : '🌫️'}</span>
          <span>
            <div class="avt-monde-nom">Monde ${mi + 1} • ${monde.nom}</div>
            <div class="avt-monde-prog">${faits}/${jouables.length} étapes • ${pct}%</div>
          </span>
          <span class="avt-monde-barre"><span style="width:${pct}%"></span></span>
        </div>
        ${mondeOuvert ? `<div class="avt-chemin">${noeudsHTML}</div>`
          : `<div class="avt-cadenas">🔒 Termine le monde précédent pour entrer${monde.ageMin ? ` — ou depuis la création du compte, âge ${monde.ageMin} ans et +` : ''}.</div>`}
      </section>`;
  }).join('');

  afficher(entetePage('🗺️ Carte Aventure', 'accueil') + `
    <div class="carte aventure-carte">
      <p class="petit-texte center">Suis le chemin, bats les boss et ouvre les coffres !<br/>
      Progression totale : <b>${faitsTotal}/${totalJouables}</b> étapes ${aventureFinie() ? '🏆 CARTE TERMINÉE !' : ''}</p>
      ${mondesHTML}
      ${aventureFinie() ? `
        <button class="btn btn-grand btn-principal mt" data-act="nav" data-ecran="diplome">🎓 Voir mon diplôme de Grand Explorateur</button>` : ''}
    </div>${navHTML('aventure')}`);

  // Un ado/adulte qui découvre la carte atterrit directement sur son monde de
  // départ, mais UNE SEULE FOIS (sinon le tap sur l'onglet Carte fait un saut
  // de scroll qui semble être un bug).
  if (!aventurePositionnee) {
    aventurePositionnee = true;
    const tousPlat = tousNoeudsAventure();
    const aucunProgres = tousPlat.filter(n => n.type !== 'coffre').every(n => !noeudFait(n));
    if (aucunProgres) {
      let cible = 'foret';
      AVENTURE.forEach(m => { if (m.ageMin > 0 && joueur.age >= m.ageMin) cible = m.id; });
      const el = document.getElementById('monde-' + cible);
      if (el && el.scrollIntoView) apres(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }
}
