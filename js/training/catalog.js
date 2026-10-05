// Standard-Übungskatalog. Pläne verweisen nur auf diese IDs.
// Jede Übung hat mindestens eine Variante. Variante: { id, name, type: 'G'|'KG'|'Z'|'E', perHand?, perSide?,
//   stages?: [...], nextAt?: Zahl (Wdh. bzw. Sekunden für "nächste Stufe"), progress?: Text, ref?: Übungs-ID }
// ref = Variante verweist auf eine eigenständige Übung (gemeinsamer Verlauf/Statistik, Typ und Stufen von dort).

export const GROUPS = ['Schultern', 'Rücken', 'Brust', 'Arme', 'Griff & Unterarme', 'Beine', 'Rumpf', 'Eigene'];

const v = (id, name, type, extra = {}) => ({ id, name, type, ...extra });
const ref = (exId, name) => ({ id: 'ref-' + exId, name, ref: exId });
const ex = (id, name, group, variants) => ({ id, name, group, variants });
const one = (id, name, group, type, extra = {}) => ex(id, name, group, [v('std', name, type, extra)]);

const PIKE_STAGES = ['Füße am Boden', 'mit Griffen (Deficit)', 'Füße in tief gehängten Ringen', 'Füße in Ringen + Griffe', 'Handstand Pushups an der Wand'];

export const DEFAULT_EXERCISES = [
  // Schultern
  one('seitheben-kabel', 'Seitheben Kabelzug', 'Schultern', 'G'),
  ex('seitheben-kh', 'Seitheben Kurzhantel', 'Schultern', [
    v('std', 'Seitheben Kurzhantel', 'G', { perHand: true, nextAt: 20, progress: 'nächste Variante (Lean-away einarmig)' }),
    v('lean-away', 'Lean-away Seitheben einarmig', 'G', { perHand: true }),
  ]),
  ex('schulteruebung', 'Schulterübung', 'Schultern', [
    ref('pike-pushups', 'Pike Pushups'),
    v('presse', 'Schulterpresse', 'G'),
    ref('seitheben-kh', 'Seitheben Kurzhantel'),
  ]),
  ex('schulterdruecken', 'Schulterdrücken', 'Schultern', [
    v('kh-sitzend', 'KH-Schulterdrücken sitzend', 'G', { perHand: true }),
    v('kh-stehend', 'KH-Schulterdrücken stehend', 'G', { perHand: true }),
    ref('pike-pushups', 'Pike Pushups'),
  ]),
  ex('reverse-flys', 'Reverse Flys', 'Schultern', [
    v('maschine', 'Maschine', 'G'),
    v('kabel', 'Kabelzug', 'G'),
    v('kh-vorgebeugt', 'vorgebeugt KH', 'G', { perHand: true }),
  ]),
  one('ring-reverse-flys', 'Ring Reverse Flys', 'Schultern', 'KG', { stages: ['Körper steil', 'Körper fast waagerecht', '3 s Absenkphase + Halten oben'], nextAt: 20 }),
  one('ring-y-raises', 'Ring Y-Raises', 'Schultern', 'KG'),
  one('pike-pushups', 'Pike Pushups', 'Schultern', 'KG', { stages: PIKE_STAGES, nextAt: 12 }),
  // Rücken
  one('klimmzuege-weit', 'Klimmzüge weit', 'Rücken', 'KG', {
    stages: ['Körpergewicht', 'mit Gewichtsgürtel (+2,5 kg Schritte, wieder bei 6 Wdh. starten)', 'Archer Pullups'], nextAt: 12,
  }),
  ex('rudern', 'Rudern', 'Rücken', [
    v('kabel', 'Kabel sitzend', 'G'),
    v('maschine', 'Rudermaschine', 'G'),
    v('kh', 'Kurzhantel-Rudern', 'G', { perHand: true }),
    v('kh-vorgebeugt', 'KH-Rudern vorgebeugt', 'G', { perHand: true }),
  ]),
  one('ring-rows', 'Ring Rows', 'Rücken', 'KG', {
    stages: ['Körper steil', 'waagerecht', 'mit Gewichtsgürtel', 'Archer Ring Rows', 'Tuck Front Lever Rows'], nextAt: 15,
  }),
  ex('ring-pullups', 'Ring Pullups', 'Rücken', [v('std', 'Ring Pullups', 'KG'), ref('ring-rows', 'Ring Rows')]),
  // Brust
  ex('obere-brust', 'Obere Brust', 'Brust', [
    v('schraeg-kh', 'Schrägbankdrücken Kurzhantel', 'G', { perHand: true }),
    v('schraeg-maschine', 'Schrägbank-Maschine', 'G'),
    v('flys-unten', 'Kabel-Flys von unten', 'G'),
  ]),
  ex('mittlere-brust', 'Mittlere Brust', 'Brust', [
    v('brustpresse', 'Brustpresse-Maschine', 'G'),
    v('butterfly', 'Butterfly-Maschine', 'G'),
    v('kabel-flys', 'Kabel-Flys', 'G'),
  ]),
  ex('untere-brust', 'Untere Brust', 'Brust', [
    ref('dips', 'Dips'),
    v('dip-maschine', 'Dip-Maschine', 'G'),
    v('flys-oben', 'Kabel-Flys von oben', 'G'),
  ]),
  one('dips', 'Dips', 'Brust', 'KG', { stages: ['Bar Dips', 'Bar Dips mit Gürtel', 'Ring Dips', 'Ring Dips mit Gürtel'], nextAt: 12 }),
  one('decline-pushups', 'Decline Pushups mit Griffen (Füße in den Ringen)', 'Brust', 'KG', {
    stages: ['Ringe ca. 40 cm', 'Ringe ca. 70 cm', 'Ringe höher + Griffe', 'Archer Decline Pushups'], nextAt: 15,
  }),
  one('ring-pushups', 'Ring Pushups', 'Brust', 'KG', {
    stages: ['Pushups mit Griffen', 'Ring Pushups', 'Ringe ausgedreht (RTO)', '3 s Absenkphase + Pause unten', 'Archer Ring Pushups'], nextAt: 15,
  }),
  one('deficit-pushups', 'Deficit Pushups mit Griffen', 'Brust', 'KG'),
  one('kh-floor-press', 'KH Floor Press', 'Brust', 'G', { perHand: true }),
  // Arme
  one('bizeps-kabel', 'Bizeps-Curls Kabel', 'Arme', 'G'),
  one('trizeps-kabel', 'Trizepsdrücken Kabel', 'Arme', 'G'),
  one('ring-bizeps', 'Ring Bizeps Curls', 'Arme', 'KG', { stages: ['Körper steil', 'flacher', 'einarmig'], nextAt: 15 }),
  one('ring-trizeps', 'Ring Trizeps Extensions', 'Arme', 'KG', { stages: ['Körper steil', 'flacher', 'Ringe tiefer'], nextAt: 15 }),
  one('kh-bizeps', 'KH Bizeps Curls', 'Arme', 'G', { perHand: true }),
  one('kh-trizeps', 'KH Überkopf-Trizepsstrecken', 'Arme', 'G'),
  // Griff & Unterarme
  ex('reverse-curls', 'Reverse Curls', 'Griff & Unterarme', [
    v('kabel', 'Kabel (Obergriff)', 'G'),
    v('kh', 'Kurzhantel (Obergriff)', 'G', { perHand: true, stages: ['normal', '3 s Absenkphase'], nextAt: 15 }),
  ]),
  one('dead-hang', 'Dead Hang', 'Griff & Unterarme', 'Z', {
    stages: ['beidarmig', 'an Handtuch oder Ringen', 'mit Gewichtsgürtel', 'einarmig abwechselnd'], nextAt: 60,
  }),
  one('false-grip-hang', 'False-Grip Hang (Ringe)', 'Griff & Unterarme', 'Z'),
  one('farmers', "Farmer's Walk / Hold", 'Griff & Unterarme', 'Z', { perHand: true }),
  one('fingertip-plank', 'Fingerspitzen-Plank', 'Griff & Unterarme', 'Z'),
  // Beine
  ex('waden', 'Waden', 'Beine', [
    v('beinpresse', 'Wadenheben an der Beinpresse', 'G'),
    v('stehend', 'Wadenmaschine stehend', 'G'),
    v('sitzend', 'Wadenmaschine sitzend', 'G'),
  ]),
  ex('wade-einbeinig', 'Einbeiniges Wadenheben', 'Beine', [
    v('kh', 'mit KH', 'G', { perHand: true }),
    v('kg', 'Körpergewicht', 'KG'),
  ]),
  ex('beinpresse', 'Beinpresse (Füße hoch)', 'Beine', [
    v('std', 'Beinpresse (Füße hoch)', 'G'),
    v('bulgarian', 'Bulgarian Split Squats KH', 'G', { perHand: true, perSide: true }),
  ]),
  one('beinstrecker', 'Beinstrecker', 'Beine', 'G'),
  one('adduktoren', 'Adduktoren-Maschine (innen)', 'Beine', 'G'),
  one('abduktoren', 'Abduktoren-Maschine (außen)', 'Beine', 'G'),
  ex('beinbeuger', 'Beinbeuger', 'Beine', [v('sitzend', 'sitzend', 'G'), v('liegend', 'liegend', 'G')]),
  one('pistol-prep', 'Pistol-Squat-Vorbereitung', 'Beine', 'E'),
  one('ausfallschritte', 'Rückwärts-Ausfallschritte KH', 'Beine', 'G', { perHand: true }),
  one('rdl', 'Rumänisches Kreuzheben KH', 'Beine', 'G', { perHand: true }),
  one('ring-split-squats', 'Ring Split Squats', 'Beine', 'KG'),
  one('ring-hamstring', 'Ring Hamstring Curls', 'Beine', 'KG'),
  // Rumpf
  one('bauchmaschine', 'Bauchmaschine', 'Rumpf', 'G'),
  one('beinheben', 'Hängendes Beinheben', 'Rumpf', 'KG', { stages: ['Knie anziehen', 'gestreckte Beine', 'Toes to Bar'] }),
  one('ring-knee-tucks', 'Ring Knee Tucks', 'Rumpf', 'KG'),
  one('kh-crunches', 'Crunches mit KH auf der Brust', 'Rumpf', 'G'),
];
