// Données de départ du prototype. Elles sont copiées dans le localStorage
// au premier chargement, puis modifiées par les actions des utilisateurs.

function buildSeed() {
  const now = Date.now();
  const DAY = 86400000;
  function ago(days) {
    return new Date(now - days * DAY).toISOString();
  }

  const users = [
    { id: "u-prof", username: "prof", password: "prof", prenom: "Michel", nom: "Lavoie", email: "michel.lavoie@cegep.ca", role: "enseignant" },
    { id: "u-julie", username: "julie", password: "julie", prenom: "Julie", nom: "Tremblay", email: "julie.tremblay@cegep.ca", role: "enseignant" },
    { id: "u-admin", username: "admin", password: "admin", prenom: "Sophie", nom: "Gagné", email: "sophie.gagne@cegep.ca", role: "admin" },
    { id: "s1", username: "etudiant", password: "etudiant", prenom: "Gérard", nom: "Yu", email: "gerard.yu@etu.cegep.ca", role: "etudiant" },
    { id: "s2", username: "lea", password: "lea", prenom: "Léa", nom: "Fortin", email: "lea.fortin@etu.cegep.ca", role: "etudiant" },
    { id: "s3", username: "nathan", password: "nathan", prenom: "Nathan", nom: "Côté", email: "nathan.cote@etu.cegep.ca", role: "etudiant" },
    { id: "s4", username: "camille", password: "camille", prenom: "Camille", nom: "Gagnon", email: "camille.gagnon@etu.cegep.ca", role: "etudiant" },
    { id: "s5", username: "olivier", password: "olivier", prenom: "Olivier", nom: "Bergeron", email: "olivier.bergeron@etu.cegep.ca", role: "etudiant" },
    { id: "s6", username: "rosalie", password: "rosalie", prenom: "Rosalie", nom: "Pelletier", email: "rosalie.pelletier@etu.cegep.ca", role: "etudiant" },
    { id: "s7", username: "felix", password: "felix", prenom: "Félix", nom: "Roy", email: "felix.roy@etu.cegep.ca", role: "etudiant" },
    { id: "s8", username: "juliette", password: "juliette", prenom: "Juliette", nom: "Morin", email: "juliette.morin@etu.cegep.ca", role: "etudiant" },
    { id: "s9", username: "antoine", password: "antoine", prenom: "Antoine", nom: "Girard", email: "antoine.girard@etu.cegep.ca", role: "etudiant" },
    { id: "s10", username: "eve", password: "eve", prenom: "Ève", nom: "Simard", email: "eve.simard@etu.cegep.ca", role: "etudiant" },
    { id: "s11", username: "zoe", password: "zoe", prenom: "Zoé", nom: "Lambert", email: "zoe.lambert@etu.cegep.ca", role: "etudiant" },
    { id: "s12", username: "william", password: "william", prenom: "William", nom: "Bouchard", email: "william.bouchard@etu.cegep.ca", role: "etudiant" }
  ];

  const classes = [
    { id: "c1", nom: "Math", groupe: "Gr 202", profId: "u-prof", archived: false },
    { id: "c3", nom: "Math 2", groupe: "Gr 204", profId: "u-prof", archived: false },
    { id: "c2", nom: "Sciences", groupe: "Gr 105", profId: "u-julie", archived: false },
    { id: "c4", nom: "Math", groupe: "Gr 101 · H2026", profId: "u-prof", archived: true }
  ];

  const membres = {
    c1: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
    c2: ["s1", "s2", "s5", "s9", "s10"],
    c3: ["s3", "s4", "s6", "s9", "s10"],
    c4: ["s7", "s8"]
  };
  const inscriptions = [];
  Object.keys(membres).forEach(function (classeId) {
    membres[classeId].forEach(function (etudiantId) {
      inscriptions.push({ classeId: classeId, etudiantId: etudiantId });
    });
  });

  const badges = [
    { id: "b1", classeId: "c1", nom: "80 % à l'examen 1", symbole: "◆", xp: 30, description: "Obtenir une note de 80 % ou plus à l'examen 1." },
    { id: "b2", classeId: "c1", nom: "Participation active", symbole: "●", xp: 10, description: "Intervenir en classe lors de trois cours consécutifs." },
    { id: "b3", classeId: "c1", nom: "Devoirs complets", symbole: "✓", xp: 20, description: "Remettre tous les devoirs de l'étape à temps." },
    { id: "b4", classeId: "c1", nom: "Entraide", symbole: "♥", xp: 15, description: "Aider un ou une collègue à comprendre une notion (confirmé par l'enseignant)." },
    { id: "b5", classeId: "c1", nom: "Défi du mois", symbole: "★", xp: 50, description: "Résoudre le problème défi affiché au tableau avant la fin du mois." },
    { id: "b6", classeId: "c2", nom: "Labo parfait", symbole: "▲", xp: 25, description: "Obtenir 100 % à un rapport de laboratoire." },
    { id: "b7", classeId: "c2", nom: "Question pertinente", symbole: "?", xp: 10, description: "Poser une question qui fait avancer la discussion en classe." },
    { id: "b8", classeId: "c2", nom: "Rapport soigné", symbole: "✎", xp: 20, description: "Remettre un rapport sans faute de français et bien structuré." },
    { id: "b9", classeId: "c3", nom: "Série complétée", symbole: "∑", xp: 20, description: "Terminer tous les exercices d'une série avant la date limite." },
    { id: "b10", classeId: "c3", nom: "Présence parfaite", symbole: "●", xp: 15, description: "Être présent à tous les cours d'un mois." },
    { id: "b11", classeId: "c4", nom: "Examen final réussi", symbole: "◆", xp: 40, description: "Obtenir 75 % ou plus à l'examen final." }
  ];

  // [étudiant, badge, il y a N jours]
  const badgeGiven = [
    ["s2", "b1", 20], ["s2", "b2", 15], ["s2", "b3", 10], ["s2", "b5", 6], ["s2", "b4", 3],
    ["s7", "b1", 20], ["s7", "b3", 10], ["s7", "b5", 4],
    ["s3", "b1", 20], ["s3", "b2", 14], ["s3", "b3", 10], ["s3", "b4", 8],
    ["s1", "b2", 9], ["s1", "b1", 2],
    ["s4", "b2", 12], ["s4", "b3", 10],
    ["s5", "b2", 11],
    ["s6", "b3", 10], ["s6", "b4", 5],
    ["s8", "b1", 20], ["s8", "b2", 13],
    ["s1", "b7", 8], ["s1", "b6", 3],
    ["s9", "b6", 3], ["s10", "b7", 7], ["s10", "b8", 4], ["s2", "b8", 4], ["s5", "b7", 9],
    ["s3", "b9", 6], ["s3", "b10", 2], ["s4", "b9", 6], ["s6", "b10", 2], ["s9", "b9", 6],
    ["s7", "b11", 200], ["s8", "b11", 200]
  ];

  // [étudiant, classe, xp, raison, il y a N jours]
  const xpGiven = [
    ["s1", "c1", 15, "Belle présentation au tableau", 1],
    ["s7", "c1", 10, "Correction d'une erreur dans les notes de cours", 7],
    ["s3", "c1", 20, "Projet d'équipe remis en avance", 5]
  ];

  const attributions = [];
  let n = 1;
  badgeGiven.forEach(function (g) {
    const badge = badges.find(function (b) { return b.id === g[1]; });
    attributions.push({ id: "a" + n++, etudiantId: g[0], classeId: badge.classeId, badgeId: badge.id, xp: badge.xp, note: "", date: ago(g[2]), parId: "u-prof" });
  });
  xpGiven.forEach(function (g) {
    attributions.push({ id: "a" + n++, etudiantId: g[0], classeId: g[1], badgeId: null, xp: g[2], note: g[3], date: ago(g[4]), parId: "u-prof" });
  });

  const notifications = [
    { id: "n1", userId: "s1", text: "Badge « 80 % à l'examen 1 » obtenu en Math (+30 XP).", date: ago(2), read: false },
    { id: "n2", userId: "s1", text: "+15 XP en Math : Belle présentation au tableau.", date: ago(1), read: false },
    { id: "n3", userId: "s1", text: "Badge « Labo parfait » obtenu en Sciences (+25 XP).", date: ago(3), read: true },
    { id: "n4", userId: "u-prof", text: "Zoé Lambert et William Bouchard viennent de créer un compte étudiant.", date: ago(1), read: false },
    { id: "n5", userId: "u-admin", text: "2 nouveaux comptes étudiants cette semaine.", date: ago(1), read: false }
  ];

  return {
    users: users,
    classes: classes,
    inscriptions: inscriptions,
    badges: badges,
    attributions: attributions,
    notifications: notifications
  };
}
