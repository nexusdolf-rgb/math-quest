/* ============================================================
   MATH QUEST v2 — screens.js
   Tous les écrans de l'application
   ============================================================ */
'use strict';

/* ---------- Morceaux d'interface réutilisables ---------- */
function navHTML(actif) {
  const items = [
    ['accueil', '🏠', 'Accueil'], ['jeux', '🎮', 'Jeux'], ['defis', '🏅', 'Défis'],
    ['classement', '🏆', 'Top'], ['profil', '🧒', 'Profil']
  ];
  return `<nav class="nav-bas">${items.map(([id, ic, nom]) =>
    `<button data-act="nav" data-ecran="${id}" class="${actif === id ? 'actif' : ''}"><span class="nb-icone">${ic}</span>${nom}</button>`
  ).join('')}</nav>`;
}
function entetePage(titre, retour = 'jeux') {
  return `<div class="tete-page">
    <button class="btn btn-retour" data-act="nav" data-ecran="${retour}">🏠</button>
    <h2>${titre}</h2>
  </div>`;
}
function puceProfil() {
  const { titre } = titreActuel();
  return `<button class="profil-puce" data-act="nav" data-ecran="profil">
    ${avatarHTML(joueur.avatar, accessoireEmoji(joueur.accessoire), 'avatar-mini')}
    <span>
      <div class="nom">${echapper(joueur.pseudo)}</div>
      <div class="titre-joueur">${titre}</div>
    </span>
  </button>`;
}
function pucePieces() {
  return `<button class="piece-puce" data-act="nav" data-ecran="boutique" title="Boutique">
    🪙 ${joueur.pieces} <span style="font-size:1.1em">＋</span></button>`;
}
function niveauSuivant() {
  return NIVEAUX.find(n => !(joueur.etoiles[n.id] > 0)) || null;
}

/* ---------- Bienvenue ---------- */
let tempAvatar = '🦊', tempAge = 7;
function ecranBienvenue() {
  afficher(`
    <div class="carte" style="margin-top:18px">
      <div class="logo">🧮</div>
      <div class="titre-jeu">Math Quest</div>
      <p class="sous-titre">Crée ton compte pour jouer !<br/>Choisis ton avatar 👇</p>
      <div class="avatar-grid">
        ${AVATARS.map(a => `<button class="avatar-btn ${a === tempAvatar ? 'selected' : ''}" data-act="choisir-avatar" data-avatar="${a}">${a}</button>`).join('')}
      </div>
      <div class="champ">
        <label>Ton pseudo</label>
        <input id="pseudo-input" maxlength="16" placeholder="Ex : SuperMathilde" autocomplete="off"/>
      </div>
      <div class="champ">
        <label>Ton âge</label>
        <div class="age-selecteur">
          ${[5, 6, 7, 8, 9, 10, 11, 12].map(a =>
            `<button class="age-btn ${a === tempAge ? 'selected' : ''}" data-act="choisir-age" data-age="${a}">${a}</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-grand btn-principal" data-act="creer-compte">C'est parti ! 🚀</button>
      <p class="petit-texte mt">🔒 Tout reste sur cet appareil, aucune donnée envoyée sur internet.</p>
    </div>`);
}

/* ---------- Accueil (tableau de bord) ---------- */
function ecranAccueil() {
  const { titre, seuilSuivant } = titreActuel();
  const palierPrecedent = [...TITRES].reverse().find(t => joueur.xp >= t[0])?.[0] ?? 0;
  const pct = seuilSuivant ? Math.min(100, Math.round((joueur.xp - palierPrecedent) / (seuilSuivant - palierPrecedent) * 100)) : 100;
  const defiFait = joueur.quotidienFait === aujourdhui();
  const conseil = CONSEILS_MASCOTTE[new Date().getDate() % CONSEILS_MASCOTTE.length];
  const suivant = niveauSuivant();
  const finis = niveauxFinis();
  const aLaUne = ['taupe', 'calcul', 'fusee', 'horloge', 'memory', 'fractions'];
  const missions = missionsJour(), j = compteurJour();

  afficher(`
    <div class="haut">
      ${puceProfil()}
      ${pucePieces()}
      <button class="btn btn-retour" data-act="son" title="Son">${AudioMX.prefs.son ? '🔊' : '🔇'}</button>
    </div>
    <div class="xp-barre"><div class="xp-remplissage" style="width:${pct}%"></div></div>
    <div class="xp-texte"><span>⭐ ${joueur.xp} XP</span><span>${seuilSuivant ? `Prochain titre : ${seuilSuivant} XP` : 'Niveau maximum ! 👑'}</span></div>

    <div class="puces-rapides">
      <div class="puce-stat feu"><span class="ps-val">🔥 ${joueur.serieJours}</span>jour${joueur.serieJours > 1 ? 's' : ''}</div>
      <div class="puce-stat"><span class="ps-val">⭐ ${totalEtoiles()}/${NIVEAUX.length * 3}</span>étoiles</div>
      <div class="puce-stat"><span class="ps-val">🏅 ${joueur.badges.length}/${BADGES.length}</span>badges</div>
    </div>

    <div class="mascotte-bloc">
      <div class="mascotte">🦊</div>
      <div class="bulle-mascotte">${conseil}</div>
    </div>

    ${suivant ? `
      <button class="defi-jour continuer" data-act="lancer-niveau" data-id="${suivant.id}">
        <span data-emoji>${suivant.emoji}</span>
        <span><div class="dj-titre">Continuer : ${suivant.nom}</div>
        <div class="dj-sous">${suivant.sous}</div></span>
        <span class="dj-fleche">➜</span>
      </button>` : `
      <button class="defi-jour continuer" data-act="nav" data-ecran="diplome">
        <span data-emoji>🎓</span>
        <span><div class="dj-titre">Voir mon diplôme</div>
        <div class="dj-sous">Les 15 niveaux sont terminés !</div></span>
        <span class="dj-fleche">➜</span>
      </button>`}

    <button class="defi-jour ${defiFait ? 'fait' : ''}" data-act="defi-jour">
      <span data-emoji>${defiFait ? '✅' : '🎯'}</span>
      <span><div class="dj-titre">${defiFait ? 'Défi réussi !' : 'Défi du Jour'}</div>
      <div class="dj-sous">${defiFait ? 'À demain pour une nouvelle aventure' : '10 questions • +50 pièces'}</div></span>
      <span class="dj-fleche">${defiFait ? '✔️' : '➜'}</span>
    </button>

    <button class="defi-jour carte-boss" data-act="lancer-boss">
      <span data-emoji>👑</span>
      <span><div class="dj-titre">Boss des Maths</div>
      <div class="dj-sous">15 épreuves mélangées • +60 pièces</div></span>
      <span class="dj-fleche">⚔️</span>
    </button>

    <div class="section-titre">🎮 À la une
      <button class="voir-plus" data-act="nav" data-ecran="jeux">Tous les jeux ➜</button>
    </div>
    <div class="grille-jeux">
      ${aLaUne.map(id => carteJeuHTML(MODES.find(m => m.id === id))).join('')}
    </div>

    <div class="section-titre">🏅 Mes missions du jour</div>
    <div class="carte" style="padding:14px">
      ${missions.list.map(idMission => missionLigneHTML(idMission, j)).join('')}
      <button class="btn btn-grand btn-bleu mt" data-act="nav" data-ecran="defis">Tous mes défis ➜</button>
    </div>

    <p class="petit-texte mt">${finis} / ${NIVEAUX.length} niveaux terminés • 🛍️ Tu as ${joueur.pieces} pièces</p>
    ${navHTML('accueil')}`);
}

function missionLigneHTML(id, j) {
  const m = MISSIONS_JOUR.find(x => x.id === id);
  const fait = joueur.missions.fait.includes(id);
  const val = m.cle === 'jeux' ? j.jeux.length : (j[m.cle] || 0);
  const pct = Math.min(100, Math.round(val / m.objectif * 100));
  return `<div class="mission-ligne ${fait ? 'finie' : ''}">
    <span class="ml-icone">${m.icone}</span>
    <span class="ml-corps">
      <div class="ml-titre">${m.lib}</div>
      <div class="ml-barre"><div style="width:${pct}%"></div></div>
      <div class="ml-recomp">${Math.min(val, m.objectif)}/${m.objectif} • 🪙 ${m.recomp.pieces} · ⭐ ${m.recomp.xp} XP</div>
    </span>
    <span class="ml-statut">${fait ? '✅' : '⏳'}</span>
  </div>`;
}

function carteJeuHTML(m) {
  const record = m.id === 'fusee' ? joueur.records.fusee : m.id === 'taupe' ? joueur.records.taupe : null;
  return `<button class="carte-jeu" style="background:${m.couleur}" data-act="ouvrir-mode" data-mode="${m.id}">
    ${m.nouveau ? '<span class="nouveau-badge">NOUVEAU</span>' : ''}
    ${m.id === 'calcul' ? `<span class="cj-badge">⭐ ${totalEtoiles()}/${NIVEAUX.length * 3}</span>` : ''}
    ${record ? `<span class="cj-badge">🏆 ${record}</span>` : ''}
    <span class="cj-emoji">${m.emoji}</span>
    <span><span class="cj-nom">${m.nom}</span><div class="cj-sous">${m.sous}</div></span>
  </button>`;
}

/* ---------- Liste de tous les jeux ---------- */
function ecranJeux() {
  afficher(entetePage('🎮 Tous les jeux', 'accueil') + `
    <div class="grille-jeux">
      ${MODES.map(carteJeuHTML).join('')}
    </div>${navHTML('jeux')}`);
}

/* ---------- Niveaux de calcul mental ---------- */
function ecranNiveaux() {
  afficher(entetePage('🧮 Calcul Mental', 'jeux') + `
    <div class="chemin">
      ${NIVEAUX.map(n => {
        const etoiles = joueur.etoiles[n.id] || 0;
        const ouvert = n.id === 1 || (joueur.etoiles[n.id - 1] || 0) > 0;
        return `<button class="niveau-btn ${ouvert ? '' : 'verrouille'} ${n.id >= 10 ? 'nouveau' : ''}" style="background:${n.couleur}"
          data-act="${ouvert ? 'lancer-niveau' : 'niv-verrouille'}" data-id="${n.id}">
          <span class="nb-emoji">${ouvert ? n.emoji : '🔒'}</span>
          <span>
            <div class="nb-num">Niveau ${n.id}</div>
            <div class="nb-nom">${n.nom}</div>
            <div class="nb-sous">${n.sous} • ${n.questions} questions</div>
          </span>
          <span class="${ouvert ? 'nb-etoiles' : 'cadenas'}">${ouvert ? '⭐'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : ''}</span>
        </button>`;
      }).join('')}
    </div>${navHTML('jeux')}`);
}

function ecranTables() {
  afficher(entetePage('✖️ Tables de multiplication', 'jeux') + `
    <p class="petit-texte mb">Choisis la table à réviser 👇</p>
    <div class="liste-table">
      ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
        <button class="table-btn" style="background:${COULEURS_TABLES[n - 2]}" data-act="lancer-table" data-n="${n}">
          ×${n}<span class="tb-sous">table de ${n}</span>
        </button>`).join('')}
    </div>${navHTML('jeux')}`);
}

/* ---------- Page Défis (missions, série, boss, badges, diplôme) ---------- */
function ecranDefis() {
  missionsJour();
  const j = compteurJour();
  const jourCycle = ((joueur.serieJours - 1) % 7) + 1;
  const finis = niveauxFinis();
  afficher(entetePage('🏅 Défis et Succès', 'accueil') + `
    <div class="carte">
      <div class="section-titre" style="margin-top:0">📅 Série de connexion</div>
      <div class="calendrier">
        ${RECOMPENSES_SERIE.map((pieces, i) => {
          const jour = i + 1;
          const fait = joueur.serieJours >= jour || (joueur.serieJours > 7 && jour <= jourCycle);
          const auj = jour === jourCycle;
          return `<div class="cal-jour ${fait ? 'fait' : ''} ${auj ? 'aujourdhui' : ''}">
            <span class="cj-icone">${fait ? '✅' : '🎁'}</span>Jour ${jour}<br/>🪙${pieces}</div>`;
        }).join('')}
      </div>
      <p class="petit-texte">Reviens chaque jour pour agrandir ta série ! (série actuelle : ${joueur.serieJours} jour${joueur.serieJours > 1 ? 's' : ''})</p>
    </div>

    <div class="carte">
      <div class="section-titre" style="margin-top:0">🎯 Missions du jour</div>
      ${joueur.missions.list.map(id => missionLigneHTML(id, j)).join('')}
    </div>

    <button class="defi-jour carte-boss" data-act="lancer-boss">
      <span data-emoji>👑</span>
      <span><div class="dj-titre">Boss des Maths</div>
      <div class="dj-sous">15 épreuves de tous les jeux • +60 pièces</div></span>
      <span class="dj-fleche">⚔️</span>
    </button>

    <button class="defi-jour ${finis === NIVEAUX.length ? 'continuer' : ''}" data-act="nav" data-ecran="diplome">
      <span data-emoji>🎓</span>
      <span><div class="dj-titre">Diplôme de Grand Champion</div>
      <div class="dj-sous">${finis === NIVEAUX.length ? 'Il est prêt, débloque-le !' : `Termine les ${NIVEAUX.length} niveaux (${finis}/${NIVEAUX.length})`}</div></span>
      <span class="dj-fleche">➜</span>
    </button>

    <div class="carte">
      <div class="section-titre" style="margin-top:0">🏅 Collection de badges (${joueur.badges.length}/${BADGES.length})</div>
      <div class="grille-badges">
        ${BADGES.map(b => {
          const ok = joueur.badges.includes(b.id);
          return `<div class="badge-carte ${ok ? 'debloque' : 'verrouille'}">
            <span class="bc-emoji">${ok ? b.emoji : '🔒'}</span>
            <span><div class="bc-nom">${b.nom}</div><div class="bc-desc">${b.desc}</div></span>
          </div>`;
        }).join('')}
      </div>
    </div>
    ${navHTML('defis')}`);
}

/* ---------- Boutique ---------- */
let boutiqueOnglet = 'themes';
function ecranBoutique() {
  afficher(entetePage('🛍️ Boutique', 'accueil') + `
    <div class="carte">
      <p class="center mb" style="font-size:1.2rem">Ton porte-monnaie : <b>🪙 ${joueur.pieces}</b></p>
      <div class="boutique-onglets">
        <button class="${boutiqueOnglet === 'themes' ? 'actif' : ''}" data-act="boutique-onglet" data-o="themes">🌈 Thèmes</button>
        <button class="${boutiqueOnglet === 'accessoires' ? 'actif' : ''}" data-act="boutique-onglet" data-o="accessoires">👑 Accessoires</button>
      </div>
      ${boutiqueOnglet === 'themes' ? `
        <div class="boutique-grille">
          ${THEMES.map(t => {
            const achete = joueur.themesAchetes.includes(t.id);
            const equipe = joueur.theme === t.id;
            return `<div class="article-boutique ${equipe ? 'equipe' : ''}">
              <div class="ab-apercu" style="background:${t.apercu || 'linear-gradient(160deg,#c7d2fe,#fbcfe8)'}">${t.emoji}</div>
              <div class="ab-nom">${t.nom}</div>
              ${equipe ? '<button class="btn btn-vert ab-btn" disabled>✓ Équipé</button>'
                : achete ? `<button class="btn btn-bleu ab-btn" data-act="equiper-theme" data-id="${t.id}">Équiper</button>`
                : `<button class="btn btn-orange ab-btn" data-act="acheter-theme" data-id="${t.id}">🪙 ${t.prix}</button>`}
            </div>`;
          }).join('')}
        </div>` : `
        <div class="boutique-grille">
          ${ACCESSOIRES.map(a => {
            const achete = joueur.accessoiresAchetes.includes(a.id);
            const equipe = joueur.accessoire === a.id;
            return `<div class="article-boutique ${equipe ? 'equipe' : ''}">
              <div class="ab-apercu" style="background:linear-gradient(135deg,#ede9fe,#fce7f3)">
                ${avatarHTML('🦊', a.emoji, 'avatar-xl')}
              </div>
              <div class="ab-nom">${a.emoji} Accessoire</div>
              ${equipe ? '<button class="btn btn-vert ab-btn" disabled>✓ Porté</button>'
                : achete ? `<button class="btn btn-bleu ab-btn" data-act="acheter-accessoire" data-id="${a.id}">Porter</button>`
                : `<button class="btn btn-orange ab-btn" data-act="acheter-accessoire" data-id="${a.id}">🪙 ${a.prix}</button>`}
            </div>`;
          }).join('')}
        </div>`}
      <p class="petit-texte mt">Gagne des pièces en jouant, en enchaînant les combos et grâce aux missions !</p>
    </div>${navHTML('')}`);
}

/* ---------- Classement ---------- */
function ecranClassement() {
  const ligne = [
    ...ROBOTS_CLASSEMENT.map(([avatar, nom, xp]) => ({ avatar, nom, xp, moi: false })),
    { avatar: joueur.avatar, accessoire: joueur.accessoire, nom: joueur.pseudo + ' (toi)', xp: joueur.xp, moi: true }
  ].sort((a, b) => b.xp - a.xp);
  const podium = ligne.slice(0, 3);
  const ordrePodium = [podium[1], podium[0], podium[2]].filter(Boolean);
  afficher(entetePage('🏆 Top Joueurs', 'accueil') + `
    <div class="carte">
      <div class="podium">
        ${ordrePodium.map(j => {
          const classe = j === podium[0] ? 'p1' : j === podium[1] ? 'p2' : 'p3';
          const medaille = j === podium[0] ? '🥇' : j === podium[1] ? '🥈' : '🥉';
          return `<div class="place ${classe}">
            <div class="p-avatar">${j.accessoire ? avatarHTML(j.avatar, accessoireEmoji(j.accessoire)) : j.avatar}</div>
            <div style="font-weight:700;font-size:.8rem">${echapper(j.nom)}</div>
            <div class="p-socle">${medaille}<br/>${j.xp} XP</div>
          </div>`;
        }).join('')}
      </div>
      ${ligne.map((j, i) => `
        <div class="ligne-classement ${j.moi ? 'moi' : ''}">
          <span class="lc-rang">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
          <span class="lc-avatar">${j.accessoire ? avatarHTML(j.avatar, accessoireEmoji(j.accessoire), 'avatar-mini') : j.avatar}</span>
          <span class="lc-nom">${echapper(j.nom)}</span>
          <span class="lc-xp">${j.xp} XP</span>
        </div>`).join('')}
      <p class="petit-texte mt">Gagne des XP pour grimper sur le podium ! 🚀</p>
    </div>${navHTML('classement')}`);
}

/* ---------- Profil ---------- */
function ecranProfil() {
  const { titre } = titreActuel();
  const precision = joueur.stats.total ? Math.round(joueur.stats.justes / joueur.stats.total * 100) : 0;
  const forces = [
    ['➕', 'Additions', joueur.stats.ops.add, '#22c55e'],
    ['➖', 'Soustractions', joueur.stats.ops.sub, '#f97316'],
    ['✖️', 'Multiplications', joueur.stats.ops.mul, '#3b82f6'],
    ['➗', 'Divisions', joueur.stats.ops.div, '#8b5cf6']
  ];
  const maxForce = Math.max(1, ...forces.map(f => f[2]));
  afficher(entetePage('🧒 Mon profil', 'accueil') + `
    <div class="carte">
      <div class="profil-tete">
        ${avatarHTML(joueur.avatar, accessoireEmoji(joueur.accessoire), 'avatar-xl')}
        <div class="pt-nom mt">${echapper(joueur.pseudo)}</div>
        <div class="pt-age">${joueur.age} ans • ${titre}</div>
      </div>
      <div class="grille-stats">
        <div class="stat-puce"><b>${joueur.xp}</b>XP totaux</div>
        <div class="stat-puce piece"><b>🪙 ${joueur.pieces}</b>pièces</div>
        <div class="stat-puce"><b>⭐ ${totalEtoiles()}/${NIVEAUX.length * 3}</b>étoiles</div>
        <div class="stat-puce"><b>${joueur.stats.parties}</b>parties jouées</div>
        <div class="stat-puce"><b>${precision}%</b>de réussite</div>
        <div class="stat-puce"><b>🔥 ${joueur.stats.serieMax}</b>meilleure série</div>
        <div class="stat-puce"><b>🚀 ${joueur.records.fusee || 0}</b>record Fusée</div>
        <div class="stat-puce"><b>🔨 ${joueur.records.taupe || 0}</b>record Tape-Taupe</div>
      </div>

      <div class="section-titre">💪 Mes points forts</div>
      ${forces.map(([ic, nom, val, coul]) => `
        <div class="force-barre">
          <span class="fb-icone">${ic}</span>
          <span style="width:110px">${nom}</span>
          <span class="fb-piste"><div style="width:${val / maxForce * 100}%;background:${coul}"></div></span>
          <span class="fb-val">${val}</span>
        </div>`).join('')}

      <div class="section-titre">Change ton avatar</div>
      <div class="liste-avatars-profil">
        ${AVATARS.map(a => `<button class="avatar-btn ${a === joueur.avatar ? 'selected' : ''}" data-act="profil-avatar" data-avatar="${a}">${a}</button>`).join('')}
      </div>

      <div class="section-titre">👑 Tes accessoires</div>
      <div class="palette" style="gap:10px">
        <button class="peinture ${!joueur.accessoire ? 'active' : ''}" style="font-size:1.3rem" data-act="profil-accessoire" data-id="">🚫</button>
        ${ACCESSOIRES.map(a => {
          const achete = joueur.accessoiresAchetes.includes(a.id);
          return `<button class="peinture ${joueur.accessoire === a.id ? 'active' : ''}" style="font-size:1.3rem;${achete ? '' : 'opacity:.4'}"
            data-act="profil-accessoire" data-id="${a.id}" title="${achete ? 'Porter' : 'À acheter dans la boutique'}">${a.emoji}</button>`;
        }).join('')}
      </div>

      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-orange" data-act="nav" data-ecran="boutique">🛍️ Aller à la boutique</button>
        <button class="btn btn-grand btn-bleu" data-act="nav" data-ecran="diplome">🎓 Mon diplôme</button>
        <button class="btn btn-grand btn-fonce" data-act="nav" data-ecran="reglages">⚙️ Réglages</button>
      </div>
    </div>${navHTML('profil')}`);
}

/* ---------- Réglages ---------- */
function ecranReglages() {
  afficher(entetePage('⚙️ Réglages', 'profil') + `
    <div class="carte">
      <div class="interrupteur-ligne">
        <span>🔊 Effets sonores</span>
        <button class="interrupteur ${AudioMX.prefs.son ? 'on' : ''}" data-act="reglage-son" aria-label="Sons"></button>
      </div>
      <div class="interrupteur-ligne">
        <span>🎵 Musique de fond</span>
        <button class="interrupteur ${AudioMX.prefs.musique ? 'on' : ''}" data-act="reglage-musique" aria-label="Musique"></button>
      </div>
      <div class="interrupteur-ligne">
        <span>🌈 Thème : ${THEMES.find(t => t.id === joueur.theme)?.emoji || '🌈'} ${THEMES.find(t => t.id === joueur.theme)?.nom || 'Classique'}</span>
        <button class="btn btn-bleu" style="padding:8px 14px" data-act="nav" data-ecran="boutique">Changer</button>
      </div>
      <div class="plusieurs-boutons mt">
        <button class="btn btn-grand btn-rouge" data-act="profil-reset">🔄 Changer de joueur (tout recommencer)</button>
      </div>
      <p class="petit-texte mt">Math Quest v2.0 — jeu éducatif hors-ligne, sans publicité et sans collecte de données.</p>
    </div>${navHTML('')}`);
}

/* ---------- Diplôme ---------- */
function ecranDiplome() {
  const finis = niveauxFinis();
  const pret = finis === NIVEAUX.length;
  afficher(entetePage('🎓 Diplôme', 'defis') + `
    <div class="diplome zone-impression">
      <div style="font-size:2.4rem">🏆</div>
      <div class="d-titre">DIPLÔME</div>
      <div style="font-weight:600;letter-spacing:3px;color:#b45309">DE GRAND CHAMPION DES MATHS</div>
      <p class="mt" style="font-size:1.05rem">Décerné à</p>
      <div class="d-souligne">${echapper(joueur.pseudo)}</div>
      <p>pour avoir terminé les ${NIVEAUX.length} niveaux de Calcul Mental<br/>
      et récolté <b>${totalEtoiles()} étoiles</b> avec <b>${joueur.xp} points XP</b> 🌟</p>
      <div class="d-cachet">${pret ? '🏅' : '🔒'}</div>
      <div class="d-date">Fait le ${dateLisible()}</div>
    </div>
    <div class="carte boutons-impression mt">
      ${pret
        ? `<button class="btn btn-grand btn-principal" data-act="imprimer">🖨️ Imprimer / Enregistrer en PDF</button>
           <p class="petit-texte mt">Astuce : choisis « Enregistrer au format PDF » comme imprimante pour garder le diplôme !</p>`
        : `<p class="center">🔒 Termine les ${NIVEAUX.length} niveaux pour débloquer ton diplôme.<br/>Progression : ${finis}/${NIVEAUX.length}</p>
           <button class="btn btn-grand btn-vert mt" data-act="nav" data-ecran="niveaux">Continuer les niveaux 🧮</button>`}
    </div>${navHTML('')}`);
}

/* ---------- Écran de résultats ---------- */
function ecranResultats(r) {
  fermerModale();
  afficher(`
    <div class="carte resultat" style="margin-top:14px">
      <div class="r-emoji">${r.emoji}</div>
      <div class="r-titre">${r.titre}</div>
      ${r.etoiles !== null && r.etoiles !== undefined ? `
        <div class="etoiles-resultat">${chapeauEtoiles(r.etoiles)}</div>` : ''}
      ${r.petitTexte ? `<p class="petit-texte">${r.petitTexte}</p>` : ''}
      ${r.recordBattu ? '<div class="record-battu mt">🏆 Record battu !</div>' : ''}
      <div class="stats-ligne">
        <div class="stat-puce"><b>${r.justes}/${r.total}</b>bonnes réponses</div>
        <div class="stat-puce"><b>🔥 ${r.serie}</b>meilleure série</div>
        <div class="stat-puce piece"><b>+${r.pieces}</b>pièces 🪙</div>
        <div class="stat-puce"><b>+${r.xp}</b>XP</div>
      </div>
      ${r.badges && r.badges.length ? `<div class="badges-gagnes">
        ${r.badges.map(id => { const b = BADGES.find(x => x.id === id); return `
          <div class="badge-gagne"><div class="bg-emoji">${b.emoji}</div><div class="bg-nom">${b.nom}</div></div>`; }).join('')}
      </div><p class="petit-texte">🏅 Nouveau(x) badge(s) !</p>` : ''}
      ${r.missions && r.missions.length ? r.missions.map(id => {
        const m = MISSIONS_JOUR.find(x => x.id === id);
        return m ? `<div class="mission-terminee">${m.icone} Mission « ${m.lib} » terminée ! +${m.recomp.pieces} 🪙</div>` : '';
      }).join('') : ''}
      <div class="plusieurs-boutons mt">
        ${r.prochainNiveau ? `<button class="btn btn-grand btn-vert" data-act="lancer-niveau" data-id="${r.prochainNiveau}">Niveau suivant ➜</button>` : ''}
        ${r.defi ? '' : '<button class="btn btn-grand btn-principal" data-act="refaire">🔄 Rejouer</button>'}
        <button class="btn btn-grand" data-act="nav" data-ecran="accueil">🏠 Accueil</button>
      </div>
    </div>`);
  animeEtoiles();
}
