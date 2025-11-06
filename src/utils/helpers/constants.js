export const VALIDPREFIX = [
  "SWING",
  "RANGE",
  "SPELL",
  "SPELLPERIODIC",
  "SPELLBUILDING",
  "ENVIRONMENTAL",
];

export const VALIDDAMAGEPREFIX = [
  "SWING",
  "RANGE",
  "SPELL",
  "SPELLPERIODIC",
];


export const VALIDSUFFIX = [
  "DAMAGE",
  "MISSED",
  "HEAL",
  "ENERGIZE",
  "DRAIN",
  "LEECH",
  "INTERRUPT",
  "DISPELFAILED",
  "DISPEL",
  "STOLEN",
  "EXTRAATTACKS",
  "AURAAPPLIEDDOSE",
  "AURAREMOVEDDOSE",
  "AURAAPPLIED",
  "AURAREMOVED",
  "AURAREFRESH",
  "AURABROKEN_SPELL",
  "AURABROKEN",
  "CASTSTART",
  "CASTSUCCESS",
  "CASTFAILED",
  "INSTAKILL",
  "DURABILITYDAMAGEALL",
  "DURABILITYDAMAGE",
  "CREATE",
  "SUMMON",
  "RESURRECT",
];

export const SPECIALEVENTS = [
  "DAMAGESHIELDMISSED",
  "DAMAGESHIELD",
  "DAMAGESPLIT",
  "ENCHANTAPPLIED",
  "ENCHANTREMOVED",
  "PARTYKILL",
  "UNITDIED",
  "UNITDESTROYED",
];

export const missTypes = [
  "ABSORB",
  "BLOCK",
  "DEFLECT",
  "DODGE",
  "EVADE",
  "IMMUNE",
  "MISS",
  "PARRY",
  "REFLECT",
  "RESIST",
]

export const auraTypes = [
  "BUFF",
  "DEBUFF",
]

export const environmentalTypes = [
  "DROWNING",
  "FALLING",
  "FATIGUE",
  "FIRE",
  "LAVA",
  "SLIME",
  "SUFFOCATION",
]

export const failedTypes = [
"A more powerful spell is already active",
"Another action is in progress",
"Can only use outside",
"Can only use while swimming",
"Can't do that while asleep",
"Can't do that while charmed",
"Can't do that while confused",
"Can't do that while fleeing",
"Can't do that while horrified",
"Can't do that while incapacitated",
"Can't do that while moving",
"Can't do that while silenced",
"Can't do that while stunned",
"Interrupted",
"Invalid target",
"Item is not ready yet",
"Must be in Bear Form, Dire Bear Form",
"Must have a Ranged Weapon equipped",
"No path available",
"No target",
"Not enough energy",
"Not enough mana",
"Not enough rage",
"Not yet recovered",
"Nothing to dispel",
"Out of range",
"Target is friendly",
"Target is hostile",
"Target needs to be in front of you.",
"Target not in line of sight",
"Target too close",
"You are dead",
"You are in combat",
"You are in shapeshift form",
"You are unable to move",
"You can't do that yet",
"You must be behind your target.",
"Your target is dead",
"Your target is too close",
"Your target is too far away",
"Your target must be in front of you.",
"Your target must be in melee range",
]

export const ENERGYTYPES = new Map([
  [-2, "health"],
  [0, "mana"],
  [1, "rage"],
  [2, "focus"],
  [3, "energy"],
  [4, "pet happiness"],
  [5, "runes"],
  [6, "runic power"]
]);

export function getEnergyType(value) {
  return ENERGYTYPES.get(parseInt(value, 10)) || false; 
}

export const SCHOOLS = new Map([
  [0, "Unknown"],
  [1, "Physical"],
  [2, "Holy"],
  [4, "Fire"],
  [8, "Nature"],
  [16, "Frost"],
  [32, "Shadow"],
  [64, "Arcane"],
  // Dual Schools
  [3, "Holystrike (Holy + Physical)"],
  [5, "Flamestrike (Fire + Physical)"],
  [6, "Holyfire (Holy + Fire)"],
  [9, "Stormstrike (Nature + Physical)"],
  [10, "Holystorm (Holy + Nature)"],
  [12, "Firestorm (Fire + Nature)"],
  [17, "Froststrike (Frost + Physical)"],
  [18, "Holyfrost (Holy + Frost)"],
  [20, "Frostfire (Fire + Frost)"],
  [24, "Froststorm (Nature + Frost)"],
  [33, "Shadowstrike (Shadow + Physical)"],
  [34, "ShadowLight (Holy + Shadow)"],
  [36, "Shadowflame (Fire + Shadow)"],
  [40, "Shadowstorm (Nature + Shadow)"],
  [48, "Shadowfrost (Frost + Shadow)"],
  [65, "Spellstrike (Arcane + Physical)"],
  [66, "Divine (Arcane + Holy)"],
  [68, "Spellfire (Arcane + Fire)"],
  [72, "Spellstorm (Arcane + Nature)"],
  [80, "Spellfrost (Arcane + Frost)"],
  [96, "Spellshadow (Arcane + Shadow)"],
  // Trio Schools
  [28, "Elemental (Fire + Nature + Frost)"],
  [124, "Chromatic (Fire + Nature + Frost + Arcane)"],
  // Penta Schools
  [126, "Magic (Holy + Fire + Nature + Frost + Shadow)"],
  [127, "Chaos (Holy + Fire + Nature + Frost + Shadow + Arcane)"]
])

export function getSchooltype(value) {
  let parsed
  if (typeof value === "number") {
    parsed = value
  } else if (typeof value === "string") {
    // Detect hex strings like "0x20" vs regular decimal strings like "32"
    parsed = parseInt(value, value.startsWith("0x") ? 16 : 10)
  } else {
    return "Invalid School"
  }
  return SCHOOLS.get(parsed) || "Unknown School"
}




export const BOSSNAMES = [
  // ===== Classic =====
  // Zul'Gurub
  "High Priest Venoxis",
  "High Priestess Jeklik",
  "High Priestess Mar'li",
  "High Priest Thekal",
  "High Priestess Arlokk",
  "Gri'lek",
  "Hazza'rah",
  "Renataki",
  "Wushoolay",
  "Jin'do the Hexxer",
  "Bloodlord Mandokir",
  "Gahz'ranka",
  "Hakkar the Soulflayer",

  // Onyxia's Lair
  "Onyxia",

  // Blackwing Lair
  "Razorgore the Untamed",
  "Vaelastrasz the Corrupt",
  "Broodlord Lashlayer",
  "Firemaw",
  "Ebonroc",
  "Flamegor",
  "Chromaggus",
  "Nefarian",

  // Molten Core
  "Lucifron",
  "Magmadar",
  "Gehennas",
  "Garr",
  "Baron Geddon",
  "Golemagg the Incinerator",
  "Shazzrah",
  "Sulfuron Harbinger",
  "Majordomo Executus",
  "Ragnaros",

  // ===== The Burning Crusade =====
  // Karazhan
  "Attumen the Huntsman",
  "Moroes",
  "Maiden of Virtue",
  "Opera Event",
  "The Crone",
  "The Big Bad Wolf",
  "Romulo",
  "Julianne",
  "Nightbane",
  "The Curator",
  "Terestian Illhoof",
  "Shade of Aran",
  "Netherspite",
  "Prince Malchezaar",

  // Gruul's Lair
  "High King Maulgar",
  "Gruul the Dragonkiller",

  // Magtheridon's Lair
  "Magtheridon",

  // Serpentshrine Cavern
  "Hydross the Unstable",
  "The Lurker Below",
  "Leotheras the Blind",
  "Fathom-Lord Karathress",
  "Morogrim Tidewalker",
  "Lady Vashj",

  // Tempest Keep
  "Al'ar",
  "Void Reaver",
  "High Astromancer Solarian",
  "Kael'thas Sunstrider",

  // Zul'Aman
  "Nalorakk",
  "Akil'zon",
  "Jan'alai",
  "Halazzi",
  "Hex Lord Malacrass",
  "Zul'jin",

  // Mount Hyjal
  "Rage Winterchill",
  "Anetheron",
  "Kaz'rogal",
  "Azgalor",
  "Archimonde",

  // Black Temple
  "High Warlord Naj'entus",
  "Supremus",
  "Shade of Akama",
  "Teron Gorefiend",
  "Gurtogg Bloodboil",
  "Reliquary of Souls",
  "Mother Shahraz",
  "The Illidari Council",
  "Illidan Stormrage",

  // Sunwell Plateau
  "Kalecgos",
  "Brutallus",
  "Felmyst",
  "Eredar Twins",
  "M'uru",
  "Entropius",
  "Kil'jaeden",

  // ===== Wrath of the Lich King =====
  // Naxxramas
  "Anub'Rekhan",
  "Grand Widow Faerlina",
  "Maexxna",
  "Noth the Plaguebringer",
  "Heigan the Unclean",
  "Loatheb",
  "Instructor Razuvious",
  "Gothik the Harvester",
  "The Four Horsemen",
  "Patchwerk",
  "Grobbulus",
  "Gluth",
  "Thaddius",
  "Sapphiron",
  "Kel'Thuzad",

  // Eye of Eternity
  "Malygos",

  // The Obsidian Sanctum
  "Sartharion",
  "Tenebron",
  "Shadron",
  "Vesperon",

  // Ulduar
  "Flame Leviathan",
  "Ignis the Furnace Master",
  "Razorscale",
  "XT-002 Deconstructor",
  "Assembly of Iron",
  "Kologarn",
  "Auriaya",
  "Hodir",
  "Thorim",
  "Freya",
  "Mimiron",
  "General Vezax",
  "Yogg-Saron",
  "Algalon the Observer",

  // Trial of the Crusader
  "Northrend Beasts",
  "Gormok the Impaler",
  "Acidmaw",
  "Dreadscale",
  "Icehowl",
  "Lord Jaraxxus",
  "Faction Champions",
  "Twin Val'kyr",
  "Anub'arak",

  // Icecrown Citadel
  "Lord Marrowgar",
  "Lady Deathwhisper",
  "Gunship Battle",
  "Deathbringer Saurfang",
  "Festergut",
  "Rotface",
  "Professor Putricide",
  "Blood Prince Council",
  "Blood-Queen Lana'thel",
  "Valithria Dreamwalker",
  "Sindragosa",
  "The Lich King",

  // The Ruby Sanctum
  "Baltharus the Warborn",
  "Saviana Ragefire",
  "General Zarithrian",
  "Halion",
];


//
export const MultipleIdEnemyNPCs = [
  "Kil'jaeden",
  "Sathrovarr the Corruptor",
]

export const MultipleNameEnemyNPCs = [
  ["M'uru", "Entropius"],
]

export const bypassEndByDIEDSessionCheckNames = [
  "Apolyon",
  "Archonisus",
  "Agamath",
  "Wild Volatile Imp",
]

export const bannedNames = [
  "Shard of Gonk",
  "Singularity",
  "Outland Single Target Training Dummy",
  "Dynamic Training Dummy",
  "Outland AOE Training Dummy",
  "Environment",
  "Arcane Orb",
]

export const bannedPetNames = [
  "totem",
  "unknown",
  "angelic feather",
  "healing rain", 
  "eliza narsingway",
]

export const clutterMobsOrMultipleBossNames = [
  ["Felmyst", 1],
  ["Unyielding Dead", 2],
  ["Sinister Reflection", 3]
]