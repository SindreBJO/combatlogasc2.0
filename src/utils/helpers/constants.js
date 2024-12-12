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
//Single Schools
[0, "Unknown"],
[1, "Physical"],
[0x2, "Holy"],
[0x4, "Fire"],
[0x8, "Nature"],
[0x10, "Frost"],
[0x20, "Shadow"],
[0x40, "Arcane"],
//Dual Schools
[0x3, "Holystrike (Holy + Physical)"],
[0x5, "Flamestrike (Fire + Physical)"],
[0x6, "Holyfire (Holy + Fire)"],
[0x9, "Stormstrike (Nature + Physical)"],
[0xA, "Holystorm (Holy + Nature)"],
[0xC, "Firestorm (Fire + Nature)"],
[0x11, "Froststrike (Frost + Physical)"],
[0x12, "Holyfrost (Holy + Frost)"],
[0x14, "Frostfire (Fire + Frost)"],
[0x18, "Froststorm (Nature + Frost)"],
[0x21, "Shadowstrike (Shadow + Physical)"],
[0x22, "ShadowLight (Holy + Shadow)"],
[0x24, "Shadowflame (Fire + Shadow)"],
[0x28, "Shadowstorm (Nature + Shadow)"],
[0x30, "Shadowfrost (Frost + Shadow)"],
[0x41, "Spellstrike (Arcane + Physical)"],
[0x42, "Divine (Arcane + Holy)"],
[0x44, "Spellfire (Arcane + Fire)"],
[0x48, "Spellstorm (Arcane + Nature)"],
[0x50, "Spellfrost (Arcane + Frost)"],
[0x60, "Spellshadow (Arcane + Shadow)"],
//Trio Schools
[0x1C, "Elemental (Fire + Nature + Frost)"],
[0x7C, "Chromatic (Fire + Nature + Frost + Arcane)"],
//Penta Schools
[0x7E, "Magic (Holy + Fire + Nature + Frost + Shadow)"],
[0x7F, "Chaos (Holy + Fire + Nature + Frost + Shadow + Arcane)"],
])

export function getSchooltype(value) {
  return SCHOOLS.get(parseInt(value, 16)) || false;
}

export const BOSSNAMES = [
  //Zul'Gurub
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

  //Onyxia's Lair
  "Onyxia",

  //Blackwing Lair
  "Razorgore the Untamed",
  "Vaelastrasz the Corrupt",
  "Broodlord Lashlayer",
  "Firemaw",
  "Chromaggus",
  "Nefarian",

  //Molten Core
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


  //Karazhan
  "Attumen the Huntsman",
  "Moroes",
  "Maiden of Virtue",
  "The Crone",
  "The Big Bad Wolf",
  "Romulo",
  "Nightbane",
  "The Curator",
  "Terestian Illhoof",
  "Shade of Aran",
  "Netherspite",
  "King",
  "Prince Malchezaar",

  //Gruul's Lair
  "High King Maulgar",
  "Gruul the Dragonkiller",

  //Magtheridon's Lair
  "Magtheridon",

  //Serpentshrine Cavern
  "Hydross the Unstable",
  "The Lurker Below",
  "Leotheras the Blind",
  "Fathom-Lord Karathress",
  "Morogrim Tidewalker",
  "Lady Vashj",

  //Tempest Keep
  "Al'ar",
  "Void Reaver",
  "High Astromancer Solarian",
  "Kael'thas Sunstrider",

  //Zul'Aman
  "Nalorakk",
  "Akil'zon",
  "Jan'alai",
  "Halazzi",
  "Hex Lord Malacrass",
  "Zul'jin",

  //Mount Hyjal
  "Rage Winterchill",
  "Anetheron",
  "Kaz'rogal",
  "Azgalor",
  "Archimonde",
  "Chromius",

  //Black Temple
  "High Warlord Naj'entus",
  "Supremus",
  "Shade of Akama",
  "Teron Gorefiend",
  "Gurtogg Bloodboil",
  "Reliquary of Souls",
  "Mother Shahraz",
  "Gathios the Shatterer",
  "Illidan Stormrage",

  //Sunwell Plateau
  "Kalecgos",
  "Brutallus",
  "Felmyst",
  "Alythess",
  "High Commander Arynyes",
  "M'uru",
  "Kil'jaeden",
]