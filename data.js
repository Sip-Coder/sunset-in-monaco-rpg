/**
 * Death at the Devereux Gala — shared data contract
 * -------------------------------------------------
 * Partner A owns this file. Partner B reads it for IDs, copy, and hotspot layout.
 * Do not duplicate these objects in HTML or CSS.
 *
 * Contract
 *   clues                 Array of collected clue IDs (strings). Mutated at runtime in game.js.
 *   checkEnding(accusedSuspect, clues)  lives here → "correct" | "wrong" | "timeout"
 *   SUSPECTS[].id         Stable suspect IDs. Killer is KILLER_ID.
 *   CLUES[].id            Stable clue IDs. Match hotspot data-clue-id attributes.
 *   CLUES[].hotspot       Percentage positions inside #scene.
 */

const GAME = {
  title: "Death at the Devereux Gala",
  tagline: "They said the collection was to die for.",
  inspector: "You",
  location: "Devereux penthouse — coat room",
  time: "2:14 a.m.",
  investigationSeconds: 300,
  accusationSeconds: 45,
  sceneImage: "assets/scene-coatroom.jpg",
  backdropImage: "assets/backdrop-ballroom.jpg",
};

const VICTIM = {
  id: "simone-vale",
  name: "Simone Vale",
  role: "Model, critic, and tonight's casualty",
  blurb:
    "Found in the coat room with her lipstick still perfect and a champagne coupe still fizzing. She came to the afterparty to be seen. She stayed long enough to be silenced.",
};

const KILLER_ID = "marcus-vale";

const SUSPECTS = [
  {
    id: "julian-cross",
    name: "Julian Cross",
    role: "Designer",
    motive: "Reputation",
    initials: "JC",
    portrait: "assets/portraits/julian-cross.jpg",
    accent: "#c9b37a",
    dossier:
      "Tonight's darling. His spring line just walked. Simone was preparing a column that would have called the 'couture' what it is: mill work with a Paris label stitched over the seam.",
    alibi:
      "Swears he was on the terrace for the fireworks toast — and that every camera was pointed at him.",
    isKiller: false,
  },
  {
    id: "adrienne-devereux",
    name: "Adrienne Devereux",
    role: "Host",
    motive: "Jealousy",
    initials: "AD",
    portrait: "assets/portraits/adrienne-devereux.jpg",
    accent: "#8b1e3f",
    dossier:
      "The penthouse is hers, the guest list is hers, and for one season so was Simone's fiancé. She smiles as if scandal were a house champagne — always on ice, never admitted.",
    alibi:
      "Circulating. Kissing cheeks. Being photographed beside the ice sculpture of her own initial.",
    isKiller: false,
  },
  {
    id: "marcus-vale",
    name: "Marcus Vale",
    role: "Husband",
    motive: "Money",
    initials: "MV",
    portrait: "assets/portraits/marcus-vale.jpg",
    accent: "#6a8aa8",
    dossier:
      "Simone's husband. Charm in a dinner jacket. The markers from three casinos would buy a lesser townhouse. He keeps saying 'my wife' as if the possessive still holds.",
    alibi:
      "Fetching her wrap, he says. Ten minutes in the coat room. Ten minutes no one else can vouch for.",
    isKiller: true,
  },
  {
    id: "lila-chen",
    name: "Lila Chen",
    role: "Assistant",
    motive: "Self-preservation",
    initials: "LC",
    portrait: "assets/portraits/lila-chen.jpg",
    accent: "#2f6b58",
    dossier:
      "Simone's right hand — bookings, invoices, the Guangzhou sample orders no one was meant to see. She has the look of someone who has already packed a bag.",
    alibi:
      "Back of house, 'handling a delivery.' Her hands shake when she says it.",
    isKiller: false,
  },
];

const CLUES = [
  {
    id: "champagne-flute",
    name: "Champagne flute",
    shortLabel: "Flute",
    pointsTo: "marcus-vale",
    isRedHerring: false,
    hotspot: { left: "10%", top: "76%" },
    sceneHint: "A coupe on the marble console — lipstick on the rim.",
    title: "The coupe with the bitter finish",
    inspection:
      "Simone's crimson on the rim. The bubbles are dying. At the bottom of the glass: a faint pharmaceutical film and the ghost of bitter almond. Tucked under the coaster, as if it slipped from a pocket in a hurry — a compounding-pharmacy receipt. Paid in cash. Initials MV. Delivery window stamped 9:40 p.m., ninety minutes before the first toast.",
    analysis:
      "Poison, not passion. A paper trail in Marcus Vale's hand. This is the only clue that names a method.",
  },
  {
    id: "torn-dress",
    name: "Torn dress",
    shortLabel: "Silk",
    pointsTo: "adrienne-devereux",
    isRedHerring: true,
    hotspot: { left: "66%", top: "36%" },
    sceneHint: "Gold silk snagged on the rack — sequins on the floor.",
    title: "A hostess gown, ruined",
    inspection:
      "A slash of gold silk, Adrienne's house livery for the evening, caught on a hanger like a confession. Sequins on the parquet. Tuberose perfume — hers, unmistakably — clinging to the tear. Two women fought here. Nails, fabric, pride.",
    analysis:
      "Adrienne had her hands on Simone. Jealousy writes itself. A scuffle is not a sentence. File as red herring — unless the other evidence agrees, which it does not.",
  },
  {
    id: "phone",
    name: "Phone",
    shortLabel: "Phone",
    pointsTo: "lila-chen",
    isRedHerring: true,
    hotspot: { left: "73%", top: "80%" },
    sceneHint: "A screen still unlocked on the velvet bench.",
    title: "An unsent execution",
    inspection:
      "Simone's phone, still warm. Draft to her lawyer: 'Lila's been skimming the sample sales and forging my signature on the atelier invoices. I fire her tonight. If she talks about the Guangzhou order, deny—' Unsent. Last photo: the two of them smiling, three hours ago, as if the knife were still in its drawer.",
    analysis:
      "Lila had a career to bury. Fear is a motive. Drafts do not pour poison. Red herring — a scandal, not a murder.",
  },
  {
    id: "love-letter",
    name: "Unsigned love letter",
    shortLabel: "Letter",
    pointsTo: "julian-cross",
    isRedHerring: true,
    hotspot: { left: "24%", top: "52%" },
    sceneHint: "Heavy paper peeking from a borrowed mink.",
    title: "A ghost of another season",
    inspection:
      "Folded into the lining of a mink that is not hers. No signature. 'Meet me where the photographers can't. I still think of the fitting room in Milan.' The prose is lush, a little theatrical — Julian's public voice. But the ink is browned, the hotel stamp is two years old, and the hand does not match the sketch-notes Julian signed at the door tonight.",
    analysis:
      "Scandal loves a designer. This letter is an old heat, or an old fantasy. It did not kill her. Red herring.",
  },
  {
    id: "timeline-note",
    name: "Timeline note",
    shortLabel: "Ledger",
    pointsTo: "marcus-vale",
    isRedHerring: false,
    hotspot: { left: "91%", top: "52%" },
    sceneHint: "The valet's clipboard, still on its hook.",
    title: "Ten minutes, named",
    inspection:
      "Guest movements for the private terrace toast at 1:52 a.m. — fireworks, everyone accounted. A handwritten addendum in the valet's impatient script: 'M. Vale — coat room, 1:54–2:04. Said he was fetching her wrap. Did not reappear until the scream.' Ten minutes. The window in which Simone died.",
    analysis:
      "Opportunity, timestamped. It matches the man on the pharmacy receipt. Motive, method, and a clock that does not lie.",
  },
];

const ENDINGS = {
  correct: {
    id: "correct",
    kicker: "Case closed",
    title: "You name Marcus Vale",
    body: [
      "He laughs too long. Then the mask slips — not grief. Accounting.",
      "Simone had found the markers against the Vale trust. Worse: the divorce papers were already signed. Dawn would have walked the penthouse, the art, and the policy out the door with her.",
      "The twist is not the poison. The Guangzhou knockoffs were never Julian's secret. They were Marcus's. He had been laundering casino losses through 'sample inventory' billed to Simone's brand. Lila noticed the numbers. Simone noticed Lila. Marcus noticed Simone reaching for her phone.",
      "The champagne, he says, was a kindness. She hated scenes.",
      "He is led out in cuffs. The photographers finally have their shot.",
    ],
  },
  wrong: {
    id: "wrong",
    kicker: "The wrong name",
    title: "They walk",
    body: [
      "The room exhales the wrong way. Your accused is taken for questioning. The lab will confirm the pharmacy receipt by morning — but morning is a lifetime in this zip code.",
      "Marcus Vale is already on a dawn flight booked under his mother's maiden name. He walks.",
      "By the time the style section prints, it will be a beautiful woman, a beautiful party, and an ugly man who got away.",
    ],
  },
  timeout: {
    id: "timeout",
    kicker: "Unsolved",
    title: "The night swallows the truth",
    body: [
      "The last town-car doors. Detectives in cheap coats replace you. Evidence is bagged by people who do not know which lipstick is a clue.",
      "In the morning the papers print four alibis and no arrest. Death at the Devereux Gala remains unsolved — which, in this crowd, is another word for forgotten.",
    ],
  },
};

const BRIEFING = {
  headline: "The coat room, after the last toast",
  paragraphs: [
    "Adrienne Devereux's penthouse. The afterparty for Julian Cross's spring line. In the coat room, supermodel-critic Simone Vale is dead.",
    "Four glittering suspects. Five pieces of evidence in one room. The cars downstairs are already leaving.",
    "Click every hotspot. Fill the dossier. Then accuse. If you name no one, the night names no one.",
  ],
};

const WRONG_ENDING_BY_SUSPECT = {
  "julian-cross":
    "Julian is photographed in cuffs that will not last the hour. His lawyer calls it a 'creative misunderstanding.' The column Simone never published would have hurt him. It would not have killed her.",
  "adrienne-devereux":
    "Adrienne allows herself to be escorted as if it were another seating arrangement. The torn silk will be explained as a 'moment.' Jealousy is not poison. She knows it. Soon, so will the papers.",
  "lila-chen":
    "Lila goes quietly, which the room mistakes for guilt. Fraud is a smaller crime. By the time anyone reads the unsent draft, the man who poured the glass is gone.",
};

/**
 * Look up helpers — both partners may use these; do not reimplement in CSS.
 */
function getSuspect(id) {
  return SUSPECTS.find((s) => s.id === id) || null;
}

function getClue(id) {
  return CLUES.find((c) => c.id === id) || null;
}

/**
 * Resolve the ending from an accusation and the collected clues.
 * @param {string|null|undefined} accusedSuspect  Suspect ID, or falsy if none.
 * @param {string[]} collected                     Clue IDs gathered so far.
 * @returns {"correct"|"wrong"|"timeout"}
 */
function checkEnding(accusedSuspect, collected) {
  const gathered = Array.isArray(collected) ? collected : [];
  if (!accusedSuspect) {
    return ENDINGS.timeout.id;
  }
  if (gathered.length < CLUES.length) {
    return ENDINGS.timeout.id;
  }
  if (accusedSuspect === KILLER_ID) {
    return ENDINGS.correct.id;
  }
  return ENDINGS.wrong.id;
}
