/* ============================================================
   MATH QUEST v3.1 — multi.js
   Multijoueur EN LIGNE pair-à-pair par code de salon (WebRTC via
   PeerJS). Aucun compte, aucun serveur à installer : les deux
   appareils se connectent directement par un petit code à 5 lettres.
   ============================================================ */
'use strict';

const Multi = {
  role: null,          // 'hote' | 'invite'
  peer: null,
  conn: null,           // pour l'invité
  connexions: {},       // pour l'hôte : id -> DataConnection
  salon: null,          // { code, joueurs:[{id,nom,avatar}], mode, etat, ... }
  onChangement: null,   // callback d'UI (salon)
  onLancement: null,    // callback au passage en jeu (invité)
  onDeconnexion: null,  // callback si l'hôte disparaît en plein jeu
  _jeuLance: false,
  _pret: false,
  _ping: null,
  _chienGarde: null,
  _dernierSignal: 0
};

const ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I
function codeAleatoire() {
  let c = '';
  for (let i = 0; i < 5; i++) c += ALPHABET_CODE[Math.floor(Math.random() * ALPHABET_CODE.length)];
  return c;
}
function idPair(code) { return 'mathquest3-' + code.toLowerCase(); }

Multi._emettre = function () { if (this.onChangement) this.onChangement(); };

Multi.disponible = () => typeof window.Peer !== 'undefined';
Multi.enLigne = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/* Messages d'erreur réseau en langage clair (jamais de jargon technique) */
Multi._messageErreur = function (type) {
  if (!this.enLigne()) {
    return '📵 Pas de connexion internet ! Le mode « avec un ami à distance » a besoin du réseau. Tous les autres jeux fonctionnent hors-ligne.';
  }
  if (type === 'peer-unavailable') {
    return 'Aucun salon trouvé avec ce code. Vérifie les 5 lettres (ton ami doit avoir appuyé sur « Créer »).';
  }
  if (type === 'network' || type === 'server-error' || type === 'socket-error'
      || type === 'socket-closed' || type === 'webrtc') {
    return 'Connexion internet trop faible ou coupée. Vérifie ton réseau et réessaie.';
  }
  return 'Connexion impossible pour le moment. Vérifie internet et réessaie.';
};

/* ---------------- HÔTE ---------------- */
Multi.creerSalon = function (mode, cb) {
  this.quitter(true);
  this.role = 'hote';
  this.onChangement = cb;
  if (!this.disponible() || !this.enLigne()) {
    this.role = null;
    this.salon = { code: '', mode, phase: 'erreur', joueurs: [],
      erreur: !this.disponible() ? 'Le multijoueur en ligne nécessite une connexion internet.' : this._messageErreur() };
    this._emettre();
    return;
  }
  const code = codeAleatoire();
  this.salon = {
    code, mode,
    joueurs: [{ id: 'hote', nom: joueur.pseudo.slice(0, 12), avatar: joueur.avatar, moi: true }],
    phase: 'salon'
  };
  const peer = new Peer(idPair(code), { debug: 0 });
  this.peer = peer;
  this._emettre();
  // Filet de sécurité : si le serveur ne répond pas en 12 s, message clair
  const timeoutOuverture = setTimeout(() => {
    if (this.salon && !this._pret) {
      this.salon.erreur = this._messageErreur('network');
      this._emettre();
    }
  }, 12000);
  peer.on('open', () => {
    clearTimeout(timeoutOuverture); this._pret = true; this.salon.ouvert = true; this.salon.erreur = null; this._emettre();
    // Battement de cœur : prouve aux invités que l'hôte et le réseau sont vivants
    clearInterval(this._ping);
    this._ping = setInterval(() => { try { this._diffuser({ t: 'vie' }); } catch {} }, 5000);
    // Si l'hôte perd lui-même son réseau, prévenir clairement
    clearInterval(this._chienGarde);
    this._horsLigneDepuis = 0;
    this._chienGarde = setInterval(() => {
      if (!this.salon || this.salon.phase === 'fin' || this.salon.phase === 'deconnecte' || this.salon.phase === 'erreur') return;
      if (!this.enLigne()) {
        if (!this._horsLigneDepuis) this._horsLigneDepuis = Date.now();
        if (Date.now() - this._horsLigneDepuis > 3000) {
          this.salon.phase = 'deconnecte';
          this.salon.erreur = '📵 Connexion internet coupée ! La partie à distance s\'est arrêtée. Tous les autres jeux fonctionnent hors-ligne.';
          this._emettre();
        }
      } else this._horsLigneDepuis = 0;
    }, 1500);
  });
  peer.on('error', err => {
    const type = err && err.type;
    if (type === 'unavailable-id') { // code déjà pris : on réessaie avec un autre
      peer.destroy();
      const code2 = codeAleatoire();
      this.salon.code = code2;
      this.peer = new Peer(idPair(code2), { debug: 0 });
      this._cablerHote(this.peer);
      this._emettre();
    } else if (type === 'disconnected') {
      // Perte passagère du signal : PeerJS se reconnecte tout seul, on n'alarme pas
      try { peer.reconnect(); } catch {}
    } else {
      this.salon.erreur = this._messageErreur(type);
      this._emettre();
    }
  });
  this._cablerHote(peer);
};
Multi._cablerHote = function (peer) {
  peer.on('connection', conn => {
    conn.on('open', () => {
      this.connexions[conn.peer] = conn;
      conn.send({ t: 'bienvenue', salon: this._salonPublic() });
      this._emettre();
    });
    conn.on('data', data => this._recuHote(conn, data));
    conn.on('close', () => { this._retirer(conn.peer); });
    conn.on('error', () => { this._retirer(conn.peer); });
  });
};
Multi._retirer = function (pid) {
  if (!this.salon) return;
  delete this.connexions[pid];
  const avant = this.salon.joueurs.length;
  this.salon.joueurs = this.salon.joueurs.filter(j => j.id !== pid);
  if (this.salon.phase === 'salon' && avant !== this.salon.joueurs.length) this._diffuser();
  this._emettre();
};
Multi._recuHote = function (conn, m) {
  const pid = conn.peer;
  if (!m) return;
  if (m.t === 'hello') {
    if (this.salon.phase !== 'salon') { conn.send({ t: 'rejete', raison: 'La partie a déjà commencé.' }); conn.close(); return; }
    if (this.salon.joueurs.length >= 4) { conn.send({ t: 'rejete', raison: 'Le salon est plein (4 max).' }); conn.close(); return; }
    if (!this.salon.joueurs.some(j => j.id === pid)) {
      this.salon.joueurs.push({ id: pid, nom: (m.nom || 'Joueur').slice(0, 12), avatar: m.avatar || '🙂' });
    }
    conn.send({ t: 'bienvenue', salon: this._salonPublic() });
    this._diffuser();
    this._emettre();
  } else if (m.t === 'reponse') {
    if (this.surReponse) this.surReponse(pid, m);
  } else if (m.t === 'emote') {
    // on ne renvoie pas l'émote à celui qui l'a envoyée (il l'a déjà affichée)
    this._diffuser({ t: 'emote', id: pid, e: m.e }, pid);
    const j = this.salon && this.salon.joueurs.find(x => x.id === pid);
    afficherEmote(j ? j.avatar : '🙂', m.e);
  } else if (m.t === 'relance') {
    this.salon.phase = 'salon';
    this._diffuser({ t: 'retour-salon' });
    this._emettre();
  }
};
Multi._salonPublic = function () {
  return JSON.parse(JSON.stringify(this.salon));
};
Multi._diffuser = function (msg, saufPid) {
  const donnees = msg || { t: 'salon', salon: this._salonPublic() };
  Object.values(this.connexions).forEach(c => {
    if (saufPid && c.peer === saufPid) return;
    try { c.send(donnees); } catch {}
  });
};
/* L'hôte répond localement via ces méthodes appelées par l'UI de jeu */
Multi.envoyer = function (m) {
  if (this.role === 'invite' && this.conn) { try { this.conn.send(m); } catch {} }
};
Multi.emote = function (e) {
  if (this.role === 'hote') this._diffuser({ t: 'emote', id: 'hote', e });
  else this.envoyer({ t: 'emote', e });
  afficherEmote(joueur.avatar, e);
};

/* ---------------- INVITÉ ---------------- */
Multi.rejoindreSalon = function (code, cb) {
  this.quitter(true);
  this.role = 'invite';
  this.onChangement = cb;
  code = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (!this.disponible() || !this.enLigne()) {
    this.role = null;
    this.salon = { code, phase: 'erreur', joueurs: [],
      erreur: !this.disponible() ? 'Le multijoueur en ligne nécessite une connexion internet.' : this._messageErreur() };
    this._emettre();
    return;
  }
  this.salon = { code, phase: 'connexion', joueurs: [] };
  this._emettre();
  const peer = new Peer({ debug: 0 });
  this.peer = peer;
  // Filet de sécurité global : aucune ouverture de connexion en 12 s
  const timeoutGlobal = setTimeout(() => {
    if (this.salon && this.salon.phase === 'connexion') {
      this.salon.phase = 'erreur';
      this.salon.erreur = this._messageErreur(this.enLigne() ? 'peer-unavailable' : 'network');
      this._emettre();
    }
  }, 12000);
  peer.on('open', () => {
    const conn = peer.connect(idPair(code), { reliable: true });
    this.conn = conn;
    const timeout = setTimeout(() => {
      if (this.salon && this.salon.phase === 'connexion') {
        this.salon.phase = 'erreur';
        this.salon.erreur = this._messageErreur('peer-unavailable');
        this._emettre();
      }
    }, 9000);
    conn.on('open', () => {
      clearTimeout(timeout);
      clearTimeout(timeoutGlobal);
      conn.send({ t: 'hello', nom: joueur.pseudo.slice(0, 12), avatar: joueur.avatar });
      this.salon.phase = 'salon';
      this._dernierSignal = Date.now();
      // Chien de garde : soit cet appareil n'a plus de réseau depuis 3 s,
      // soit l'hôte n'a rien envoyé depuis 15 s (sa connexion à lui est morte).
      clearInterval(this._chienGarde);
      this._horsLigneDepuis = 0;
      const messageCoupure = '📵 Connexion internet coupée ! La partie à distance s\'est arrêtée. Tous les autres jeux fonctionnent hors-ligne.';
      this._chienGarde = setInterval(() => {
        if (!this.salon || this.salon.phase === 'fin' || this.salon.phase === 'deconnecte' || this.salon.phase === 'erreur') return;
        const coupureLocale = !this.enLigne();
        if (coupureLocale) {
          if (!this._horsLigneDepuis) this._horsLigneDepuis = Date.now();
        } else this._horsLigneDepuis = 0;
        if ((this._horsLigneDepuis && Date.now() - this._horsLigneDepuis > 3000)
            || Date.now() - this._dernierSignal > 15000) {
          this.salon.phase = 'deconnecte';
          this.salon.erreur = messageCoupure;
          this._emettre();
        }
      }, 1500);
      this._emettre();
    });
    conn.on('data', data => { this._dernierSignal = Date.now(); this._recuInvite(data); });
    conn.on('close', () => {
      if (this.salon && this.salon.phase !== 'fin') {
        this.salon.erreur = 'L\'hôte a quitté la partie.';
        this.salon.phase = 'deconnecte';
        this._emettre();
      }
    });
    conn.on('error', () => {
      if (this.salon && this.salon.phase === 'connexion') {
        this.salon.phase = 'erreur';
        this.salon.erreur = this._messageErreur('peer-unavailable');
        this._emettre();
      }
    });
  });
  peer.on('error', err => {
    const type = err && err.type;
    clearTimeout(timeoutGlobal);
    this.salon.phase = 'erreur';
    this.salon.erreur = this._messageErreur(type);
    this._emettre();
  });
};
Multi._recuInvite = function (m) {
  if (!m) return;
  if (m.t === 'vie') return; // simple battement de cœur, rien à afficher
  if (m.t === 'bienvenue' || m.t === 'salon') {
    this.salon = m.salon;
    // Le hôte vient de lancer la partie : on installe l'écran de jeu une seule fois
    if (m.salon.phase === 'jeu' && this._jeuLance !== m.salon.mode) {
      this._jeuLance = m.salon.mode;
      if (this.onLancement) this.onLancement(m.salon.mode);
      return;
    }
    if (this.onChangement) this.onChangement();
  } else if (m.t === 'rejete') {
    this.salon.erreur = m.raison || 'Salon inaccessible.';
    this.salon.phase = 'erreur';
    this._emettre();
  } else if (m.t === 'question' || m.t === 'pointage' || m.t === 'fin' ||
             m.t === 'attente' || m.t === 'emote' || m.t === 'retour-salon' || m.t === 'de' ||
             m.t === 'rapido-start' || m.t === 'rapido-points' || m.t === 'rapido-fin' ||
             m.t === 'coop-start' || m.t === 'coop-pointage' || m.t === 'coop-fin') {
    if (m.t === 'emote' && !this.jeu) {
      const j = this.salon && this.salon.joueurs.find(x => x.id === m.id);
      return afficherEmote(j ? j.avatar : '🙂', m.e);
    }
    if (this.jeu) this.jeu(m);
  }
};
Multi.monId = function () { return this.role === 'hote' ? 'hote' : (this.peer ? this.peer.id : 'invite'); };

/* ---------------- Commun ---------------- */
Multi.lancerPartie = function (regle) {
  if (this.role !== 'hote' || !this.salon.joueurs[1]) return;
  this.salon.phase = 'jeu';
  this.regle = regle;
  this._diffuser({ t: 'salon', salon: this._salonPublic() });
  this._emettre();
};
Multi.quitter = function (silencieux) {
  clearInterval(this._ping); this._ping = null;
  clearInterval(this._chienGarde); this._chienGarde = null;
  try { Object.values(this.connexions).forEach(c => c.close()); } catch {}
  try { this.conn && this.conn.close(); } catch {}
  try { this.peer && this.peer.destroy(); } catch {}
  this.peer = null; this.conn = null; this.connexions = {};
  this.role = null; this.salon = null; this.jeu = null; this.regle = null;
  this.surReponse = null; this._jeuLance = false; this._pret = false;
  this._horsLigneDepuis = 0; this._dernierSignal = 0;
  if (!silencieux) this._emettre();
};
