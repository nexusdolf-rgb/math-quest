/* ============================================================
   MATH QUEST v2 — data.js
   Contenu du jeu : niveaux, modes, badges, boutique, coloriages
   ============================================================ */
'use strict';

const AVATARS = ['🦊', '🦁', '🐼', '🐸', '🦄', '🐙', '🦖', '🐶', '🐱', '🦉', '🐢', '🦝', '🐵', '🐯', '🐰', '🐨'];

/* 15 niveaux de calcul mental */
const NIVEAUX = [
  { id: 1,  nom: 'Petits Pas',              sous: 'Additions 1-10',      operation: 'add',    min: 1,  max: 10,  questions: 8, emoji: '🍎', couleur: 'linear-gradient(135deg,#fb7185,#ec4899)' },
  { id: 2,  nom: 'Grands Pas',              sous: 'Additions 1-20',      operation: 'add',    min: 1,  max: 20,  questions: 8, emoji: '🍊', couleur: 'linear-gradient(135deg,#fb923c,#f59e0b)' },
  { id: 3,  nom: 'Premières Soustractions', sous: 'Retirer 1-10',        operation: 'sub',    min: 1,  max: 10,  questions: 8, emoji: '🍇', couleur: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' },
  { id: 4,  nom: 'Plus Loin',               sous: 'Additions 10-50',     operation: 'add',    min: 10, max: 50,  questions: 10, emoji: '🍓', couleur: 'linear-gradient(135deg,#f87171,#f43f5e)' },
  { id: 5,  nom: 'Retraits',                sous: 'Soustractions 5-20',  operation: 'sub',    min: 5,  max: 20,  questions: 10, emoji: '🍋', couleur: 'linear-gradient(135deg,#facc15,#f59e0b)' },
  { id: 6,  nom: 'Table de 2',              sous: 'Multiplications ×2',  operation: 'mul',    facteur: 2, questions: 8, emoji: '🌟', couleur: 'linear-gradient(135deg,#fbbf24,#f97316)' },
  { id: 7,  nom: 'Table de 3',              sous: 'Multiplications ×3',  operation: 'mul',    facteur: 3, questions: 8, emoji: '✨', couleur: 'linear-gradient(135deg,#22d3ee,#3b82f6)' },
  { id: 8,  nom: 'Table de 5',              sous: 'Multiplications ×5',  operation: 'mul',    facteur: 5, questions: 8, emoji: '🎈', couleur: 'linear-gradient(135deg,#2dd4bf,#10b981)' },
  { id: 9,  nom: 'Mélangé',                 sous: 'Additions et retraits', operation: 'mixed', min: 1, max: 20, questions: 10, emoji: '🌈', couleur: 'linear-gradient(135deg,#818cf8,#8b5cf6)' },
  { id: 10, nom: 'Tables Faciles',          sous: 'Tables de 2 à 5',     operation: 'multranche', tranche: [2, 5], questions: 10, emoji: '🎯', couleur: 'linear-gradient(135deg,#34d399,#059669)' },
  { id: 11, nom: 'Grandes Tables',          sous: 'Tables de 6 à 10',    operation: 'multranche', tranche: [6, 10], questions: 10, emoji: '🔥', couleur: 'linear-gradient(135deg,#fb923c,#ef4444)' },
  { id: 12, nom: 'Premières Divisions',     sous: 'Partages de 2 à 5',   operation: 'divtranche', tranche: [2, 5], questions: 10, emoji: '➗', couleur: 'linear-gradient(135deg,#38bdf8,#6366f1)' },
  { id: 13, nom: 'Géants Additions',        sous: 'Additions 10-100',    operation: 'add',    min: 10, max: 100, questions: 10, emoji: '🐘', couleur: 'linear-gradient(135deg,#c084fc,#7c3aed)' },
  { id: 14, nom: 'Géants Soustractions',    sous: 'Retraits 20-100',     operation: 'sub',    min: 20, max: 100, questions: 10, emoji: '🦒', couleur: 'linear-gradient(135deg,#f472b6,#be185d)' },
  { id: 15, nom: 'Grand Champion',          sous: 'Défi Final de boss',  operation: 'mixeddur', min: 5, max: 80, questions: 12, emoji: '🏆', couleur: 'linear-gradient(135deg,#d946ef,#db2777)' }
];

/* 21 modes de jeu */
const MODES = [
  { id: 'calcul',    nom: 'Calcul Mental',          sous: '15 niveaux progressifs',           emoji: '🧮', couleur: 'linear-gradient(135deg,#fb7185,#ec4899)' },
  { id: 'tables',    nom: 'Tables de Multiplication', sous: 'Choisis ta table ×2 à ×10',      emoji: '✖️', couleur: 'linear-gradient(135deg,#fbbf24,#f97316)' },
  { id: 'divisions', nom: 'Divisions',              sous: 'Partage équitable',                emoji: '➗', couleur: 'linear-gradient(135deg,#38bdf8,#6366f1)', nouveau: true },
  { id: 'taupe',     nom: 'Tape-Taupe',             sous: 'Trouve la bonne opération !',      emoji: '🔨', couleur: 'linear-gradient(135deg,#a3e635,#16a34a)', nouveau: true },
  { id: 'devinette', nom: 'Devinette',              sous: 'Devine le nombre mystère',         emoji: '🎯', couleur: 'linear-gradient(135deg,#a78bfa,#a855f7)' },
  { id: 'vrai-faux', nom: 'Vrai ou Faux',           sous: "L'équation est-elle correcte ?",   emoji: '✅', couleur: 'linear-gradient(135deg,#34d399,#14b8a6)' },
  { id: 'manquant',  nom: 'Nombre Manquant',        sous: 'Trouve le chiffre caché',          emoji: '❓', couleur: 'linear-gradient(135deg,#38bdf8,#3b82f6)' },
  { id: 'comparaison', nom: 'Comparaison',          sous: 'Plus petit, plus grand ou égal ?', emoji: '⚖️', couleur: 'linear-gradient(135deg,#f472b6,#a855f7)', nouveau: true },
  { id: 'ordre',     nom: 'Ordre des Nombres',      sous: 'Du plus petit au plus grand',      emoji: '📊', couleur: 'linear-gradient(135deg,#818cf8,#8b5cf6)' },
  { id: 'memory',    nom: 'Memory Math',            sous: 'Trouve les paires',                emoji: '🃏', couleur: 'linear-gradient(135deg,#2dd4bf,#06b6d4)' },
  { id: 'fractions', nom: 'Fractions',              sous: 'Compare les pizzas',               emoji: '🍕', couleur: 'linear-gradient(135deg,#fb923c,#ef4444)' },
  { id: 'suite',     nom: 'Suite Logique',          sous: 'Trouve le prochain nombre',        emoji: '🔢', couleur: 'linear-gradient(135deg,#a3e635,#22c55e)' },
  { id: 'compte',    nom: 'Compte Rapide',          sous: 'Compte les objets, vite !',        emoji: '🍒', couleur: 'linear-gradient(135deg,#e879f9,#ec4899)' },
  { id: 'dizaines',  nom: 'Dizaines et Unités',     sous: 'Les barres et les cubes',          emoji: '🧱', couleur: 'linear-gradient(135deg,#f472b6,#8b5cf6)', nouveau: true },
  { id: 'horloge',   nom: "L'Heure",                sous: 'Apprends à lire la pendule',       emoji: '⏰', couleur: 'linear-gradient(135deg,#60a5fa,#2563eb)', nouveau: true },
  { id: 'monnaie',   nom: 'La Monnaie',             sous: 'Compte les pièces et billets',     emoji: '🪙', couleur: 'linear-gradient(135deg,#fcd34d,#d97706)', nouveau: true },
  { id: 'formes',    nom: 'Formes Géométriques',    sous: 'Cercle, triangle, hexagone…',      emoji: '🔷', couleur: 'linear-gradient(135deg,#22d3ee,#0891b2)', nouveau: true },
  { id: 'fusee',     nom: 'Fusée',                  sous: '60 secondes, un max de calculs !', emoji: '🚀', couleur: 'linear-gradient(135deg,#60a5fa,#8b5cf6)' },
  { id: 'coloriage', nom: 'Coloriage Magique',      sous: 'Fais apparaître les dessins',      emoji: '🎨', couleur: 'linear-gradient(135deg,#f472b6,#a78bfa,#22d3ee)' },
  { id: 'duel',      nom: 'Mode Duel',              sous: 'Affronte un ami',                  emoji: '⚔️', couleur: 'linear-gradient(135deg,#f43f5e,#a855f7,#06b6d4)' },
  { id: 'party',     nom: 'Multijoueur',            sous: 'Joue à plusieurs (2 à 4)',         emoji: '🎉', couleur: 'linear-gradient(135deg,#34d399,#22d3ee,#3b82f6)' }
];

/* 16 badges */
const BADGES = [
  { id: 'first_star',  nom: 'Première Étoile', emoji: '⭐', desc: 'Termine ton premier niveau' },
  { id: 'perfect',     nom: 'Sans Faute',      emoji: '💯', desc: '3 étoiles à un niveau' },
  { id: 'streak_5',    nom: 'En Feu',          emoji: '🔥', desc: "5 bonnes réponses d'affilée" },
  { id: 'half_done',   nom: 'Mi-Chemin',       emoji: '🎯', desc: 'Termine 7 niveaux' },
  { id: 'champion',    nom: 'Champion',        emoji: '🏆', desc: 'Termine les 15 niveaux' },
  { id: 'star_master', nom: 'Maître Étoile',   emoji: '✨', desc: 'Récolte 30 étoiles' },
  { id: 'xp_100',      nom: 'Centurion',       emoji: '🎖️', desc: 'Gagne 100 XP' },
  { id: 'xp_500',      nom: 'Légende',         emoji: '👑', desc: 'Gagne 500 XP' },
  { id: 'xp_1000',     nom: 'Grand Maître',    emoji: '🌌', desc: 'Gagne 1000 XP' },
  { id: 'justes_100',  nom: 'Cent Justes',     emoji: '✅', desc: '100 bonnes réponses' },
  { id: 'explorateur', nom: 'Explorateur',     emoji: '🧭', desc: "Essaie 5 jeux différents" },
  { id: 'memory_pro',  nom: 'Mémoire d\'Éléphant', emoji: '🐘', desc: 'Memory en 9 coups ou moins' },
  { id: 'pilote',      nom: 'Pilote Fusée',    emoji: '🚀', desc: '15 bonnes réponses en Fusée' },
  { id: 'taupe_pro',   nom: 'Tapeur de Taupes', emoji: '🔨', desc: '20 taupes en une partie' },
  { id: 'tirelire',    nom: 'Petite Tirelire', emoji: '🐷', desc: 'Accumule 200 pièces' },
  { id: 'assidu',      nom: 'Assiduité',       emoji: '📅', desc: 'Reviens 3 jours de suite' }
];

const TITRES = [
  [0, 'Apprenti Calculateur'], [100, 'Petit Calculateur'], [300, 'Champion en herbe'],
  [600, 'Pro des Nombres'], [1000, 'Génie des Maths'], [1800, 'Légende des Chiffres']
];

const ROBOTS_CLASSEMENT = [
  ['🤖', 'RoboCalc', 1480], ['🦊', 'Filou le Malin', 1160], ['🦄', 'Stella', 940],
  ['🐼', 'Ping', 780], ['🦁', 'Léo Rugissant', 630], ['🐙', 'Octave', 490],
  ['🦉', 'Chouette Sage', 380], ['🐶', 'Rex', 280], ['🐸', 'Coâa', 190], ['🐢', 'Lento', 110]
];

const COULEURS_TABLES = [
  'linear-gradient(135deg,#fb7185,#ec4899)', 'linear-gradient(135deg,#fb923c,#f59e0b)',
  'linear-gradient(135deg,#a78bfa,#8b5cf6)', 'linear-gradient(135deg,#f87171,#f43f5e)',
  'linear-gradient(135deg,#facc15,#eab308)', 'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#22d3ee,#3b82f6)', 'linear-gradient(135deg,#2dd4bf,#10b981)',
  'linear-gradient(135deg,#818cf8,#8b5cf6)'
];

/* Missions quotidiennes */
const MISSIONS_JOUR = [
  { id: 'justes15',  lib: 'Réponds juste à 15 questions', objectif: 15, cle: 'correct', icone: '✅', recomp: { pieces: 20, xp: 20 } },
  { id: 'jeux3',     lib: 'Essaie 3 jeux différents',     objectif: 3,  cle: 'jeux',    icone: '🧭', recomp: { pieces: 25, xp: 15 } },
  { id: 'parties3',  lib: 'Termine 3 parties',            objectif: 3,  cle: 'parties', icone: '🎮', recomp: { pieces: 20, xp: 10 } },
  { id: 'parfait1',  lib: 'Obtiens un sans-faute',        objectif: 1,  cle: 'parfait', icone: '💯', recomp: { pieces: 30, xp: 30 } },
  { id: 'etoiles5',  lib: 'Gagne 5 étoiles',              objectif: 5,  cle: 'etoiles', icone: '⭐', recomp: { pieces: 25, xp: 20 } }
];
const RECOMPENSES_SERIE = [10, 15, 20, 25, 30, 40, 60];

/* Boutique : thèmes d'ambiance */
const THEMES = [
  { id: 'classique', nom: 'Classique', emoji: '🌈', prix: 0 },
  { id: 'espace',    nom: 'Espace',    emoji: '🪐', prix: 70, apercu: 'linear-gradient(135deg,#312e81,#4c1d95)' },
  { id: 'ocean',     nom: 'Océan',     emoji: '🌊', prix: 60, apercu: 'linear-gradient(135deg,#38bdf8,#6366f1)' },
  { id: 'foret',     nom: 'Forêt',     emoji: '🌳', prix: 60, apercu: 'linear-gradient(135deg,#4ade80,#15803d)' },
  { id: 'couchant',  nom: 'Coucher de soleil', emoji: '🌅', prix: 40, apercu: 'linear-gradient(135deg,#fb7185,#a78bfa)' },
  { id: 'bonbon',    nom: 'Bonbon',    emoji: '🍬', prix: 40, apercu: 'linear-gradient(135deg,#f9a8d4,#93c5fd)' },
  { id: 'nuit',      nom: 'Nuit étoilée', emoji: '🌙', prix: 90, apercu: 'linear-gradient(135deg,#0f172a,#334155)' }
];
/* Boutique : accessoires d'avatar */
const ACCESSOIRES = [
  { id: 'couronne',  emoji: '👑', prix: 100 },
  { id: 'chapeau',   emoji: '🎩', prix: 60 },
  { id: 'sorcier',   emoji: '🧙', prix: 120 },
  { id: 'casquette', emoji: '🧢', prix: 40 },
  { id: 'noeud',     emoji: '🎀', prix: 40 },
  { id: 'lunettes',  emoji: '🕶️', prix: 50 },
  { id: 'heros',     emoji: '🦸', prix: 80 }
];

/* Coloriages magiques (grilles ; . = case vide) */
const COLORIAGES = [
  { id: 'coeur', nom: 'Cœur', emoji: '💖', modele: [
    '..rr..rr..', '.rrrrrrrr.', 'rrrrrrrrrr', 'rrrrrrrrrr',
    '.rrrrrrrr.', '..rrrrrr..', '...rrrr...', '....rr....'
  ], couleurs: { r: '#f43f5e' } },
  { id: 'fusee', nom: 'Fusée', emoji: '🚀', modele: [
    '....rr....', '...rwwr...', '...rrrr...', '..rrrrrr..',
    '.r.rrrr.r.', '..f.ff.f..', '...f..f...'
  ], couleurs: { r: '#ef4444', w: '#7dd3fc', f: '#f97316' } },
  { id: 'maison', nom: 'Maison', emoji: '🏠', modele: [
    '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', 'yyyyyyyyyy',
    'yyyyyyyyyy', 'yybbyyyyyy', 'yybbyyyyyy', 'yyyyyyyyyy'
  ], couleurs: { r: '#ef4444', y: '#fde047', b: '#b45309' } },
  { id: 'champi', nom: 'Champignon', emoji: '🍄', modele: [
    '...rrrr...', '..rwrrwr..', '.rrrrrrrr.', 'rrrrrrrrrr',
    '.rwwwwwwr.', '..wwwwww..', '..w.kk.w..', '..wwwwww..'
  ], couleurs: { r: '#ef4444', w: '#f8fafc', k: '#2d2350' } },
  { id: 'soleil', nom: 'Soleil', emoji: '☀️', modele: [
    '..o...o...', '...oyyo...', '.ooyyyyoo.', '.oyyyyyo..',
    '.ooyyyyoo.', '...oyyo...', '..o...o...', 'o.......o.'
  ], couleurs: { o: '#f59e0b', y: '#facc15' } }
];
const PALETTE = ['#f43f5e', '#ef4444', '#f97316', '#facc15', '#fde047', '#22c55e', '#3b82f6', '#7dd3fc', '#8b5cf6', '#ec4899', '#92400e', '#2d2350', '#f8fafc'];

/* Formes géométriques (SVG inline) */
const FORMES = [
  { nom: 'Cercle',    cotes: null, svg: '<circle cx="90" cy="90" r="66" fill="{c}"/>' },
  { nom: 'Triangle',  cotes: 3, svg: '<polygon points="90,22 158,150 22,150" fill="{c}"/>' },
  { nom: 'Carré',     cotes: 4, svg: '<rect x="28" y="28" width="124" height="124" rx="10" fill="{c}"/>' },
  { nom: 'Rectangle', cotes: 4, svg: '<rect x="18" y="50" width="144" height="80" rx="10" fill="{c}"/>' },
  { nom: 'Pentagone', cotes: 5, svg: '<polygon points="90,20 158,68 132,148 48,148 22,68" fill="{c}"/>' },
  { nom: 'Hexagone',  cotes: 6, svg: '<polygon points="57,25 123,25 160,90 123,155 57,155 20,90" fill="{c}"/>' },
  { nom: 'Losange',   cotes: 4, svg: '<polygon points="90,18 160,90 90,162 20,90" fill="{c}"/>' },
  { nom: 'Étoile',    cotes: 5, svg: '<polygon points="90,14 109,70 168,72 121,108 138,164 90,132 42,164 59,108 12,72 71,70" fill="{c}"/>' },
  { nom: 'Ovale',     cotes: null, svg: '<ellipse cx="90" cy="90" rx="70" ry="52" fill="{c}"/>' },
  { nom: 'Trapèze',   cotes: 4, svg: '<polygon points="45,45 135,45 165,145 15,145" fill="{c}"/>' }
];
const FORME_COULEURS = ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#f97316', '#eab308', '#06b6d4', '#f43f5e'];

/* Conseils de la mascotte */
const CONSEILS_MASCOTTE = [
  "Bienvenue ! Prêt(e) à devenir un génie des maths ? 🦊",
  "Astuce : le Défi du Jour rapporte un bonus de 50 pièces ! 🎯",
  "Entraîne-toi tous les jours : la série de jours donne des récompenses 📅",
  "Chaque erreur est un pas vers la réussite. Ne lâche rien ! 💪",
  "Plus tes réponses s'enchaînent, plus tu gagnes de pièces. Combo ! 🔥",
  "Astuce de renard : pour 7 + 8, fais 7 + 3 = 10 puis 10 + 5 = 15 🦊",
  "Révise tes tables le plus souvent possible, c'est le secret des champions ✖️",
  "Termine tous les niveaux pour recevoir ton diplôme officiel ! 🎓"
];

const OBJETS_COMPTE = ['🍒', '⭐', '🍌', '🐠', '🎈', '🌸', '🍓', '💎', '🐝', '🍩'];
