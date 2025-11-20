import {
  VALIDPREFIX,
  VALIDSUFFIX,
  SPECIALEVENTS,
  VALIDDAMAGEPREFIX,
  getEnergyType,
  getSchooltype,
} from "./constants.js";

// The string goes through 2 sets of processing here:

// 1. Fromat an array that can continue the parsing process, these are 8 of the base values all strings should have
//    a. Validate that there is a sufficent number of parts of data in the string and that the string is formatted correctly
//    b. The event is split into prefix and suffix
//    c. Assuming the log is from the current year, the date and time are converted to a new Date() format
//    d. The source and destination flags are parsed to a tag that directly states the affiliation to the player

//          Array format:
//          [0] = time [ms since jan 1st 1970 00:00:00 UTC] Unix Format
//          [1] = event [prefix and suffix]
//          [2] = sourceGUID
//          [3] = sourceName
//          [4] = sourceFlags (simplified affiliation to the player)
//          [5] = destGUID
//          [6] = destName
//          [7] = destFlags (simplified affiliation to the player)
//          [8] = additional data, the length of the total array varies and is handled in the next step

// Worth to mention:
// If a parse fails verification at any stage, false is returned in dataContext and the raw string is saved in invalidData
// If a parse is a empty string "", when handeling invalid string in dataContext "\r" is returned due to the .txt format
// The last line of the file is always empty
// All of the above mentions are corrected after return in dataContext.js
// Special event is tagged with "specialEvent" as prefix and the event name as suffix
// Source and destination flags are tagged with a specific statement that clearly states the affiliation to the player in a simple matter going forward

// 2. Parse the array into an object that can be stored in metadata
//    a) The base parameters object are returned as an part of the final object
//    b) the parameters for prefix and suffix are returned as the final part of the return object which details all values for that parse with corresponding keys
//       - In some cases the parse is missing default structure and the length is not correct, these values will be returned as unique in the final object, so far only buffType have resulted in this
//    c) The final object is returned with all the values from the parse with corresponding keys


// Global year variable for time conversion
let globalYearSet;
export function setGlobalYear(year) {
  globalYearSet = year;
}

function getActualHit(amount, overkill) {
  // Defensive: ensure inputs are numbers
  amount = amount || 0;
  overkill = overkill || 0;

  // If overkill is smaller than the hit, subtract it normally.
  // If it's bigger (massive overkill case), ignore it.
  if (overkill < amount) {
    return amount - overkill;
  }

  return 0;
}

//Returns the length of the array after initial validation and formatting (later used for testing purposes with a parsed object)
export function testArrayLength(string) {
  let parseArray = validateAndSplitParse(string);
  if (parseArray === false) {
    return false;
  }

  parseArray[0] = setTimeUnix(parseArray[0]);
  if (parseArray[0] === false) {
    return false;
  }

  parseArray[1] = setEvent(parseArray[1]);
  if (parseArray[1] === false) {
    return false;
  }
  parseArray[1] = parseArray[1].join("_");
  return [parseArray.length, parseArray];
}

// Main export function that parses a string into an parsed object
export function parseString(string) {
  //Step 1 preparing Array

  if (typeof string !== "string") {
    return false;
  }

  let parseArray = validateAndSplitParse(string);
  if (parseArray === false) {
    return false;
  }

  parseArray[0] = setTimeUnix(parseArray[0]);
  if (parseArray[0] === false) {
    return false;
  }

  parseArray[1] = setEvent(parseArray[1]);
  if (parseArray[1] === false) {
    return false;
  }

  parseArray[4] = parseAffiliation(parseArray[4]);
  if (parseArray[4] === false) {
    return false;
  }

  parseArray[7] = parseAffiliation(parseArray[7]);
  if (parseArray[7] === false) {
    return false;
  }

  //Step 2 preparing return Object

  const baseParameters = returnBaseParameters(parseArray);

  let indexCount = 7; // 8 base values, used to guide the selection of the next values
  let prefixParameters = returnPrefixParameters(
    parseArray,
    parseArray[1][0],
    indexCount,
  );
  if (prefixParameters !== undefined) {
    indexCount += Object.keys(prefixParameters).length || 0;
  }
  let suffixParameters = returnSuffixParameters(
    parseArray,
    parseArray[1][1],
    indexCount,
  );
  return {
    ...baseParameters,
    ...prefixParameters,
    ...suffixParameters,
  };
}

// Validates and splits the input string into an array, achieving 99.99% test coverage across 100 million log lines (20GB of combatlog.txt files).
// The only known failure was due to a game logging error (missing buff specification on serpent sting tick).
// If verification fails, further handling occurs in dataContext.js by comparing expected actual value components.
// 1. Splits by comma and double space, as dictated by the log format.
// 2. Uses a thoroughly tested regex to handle all known log formats.
function validateAndSplitParse(string) {
  if (typeof string === "string") {
    const commaCount = (string.match(/,/g) || []).length;
    const doubleSpaceCount = (string.match(/  /g) || []).length;

    if (commaCount > 4 && doubleSpaceCount === 1) {
      string = string.replace(/"/g, '');
      let parts = string.split("  ");
      let part1 = parts[0].split(" ");
      let part2 = parts[1].split(/,(?! )/);

      if ([...part1, ...part2].length < 8) {
        return false;
      }
      return [[...part1], ...part2.map((str) => str.replace(/\r/g, ""))];
    }
  }

  return false;
}

//This calibrates the time to a unix timestamp, assuming the log is from the current year/input year
function setTimeUnix(timeStamp) {
  const [monthStr, dayStr] = timeStamp[0].split("/");
  const month = monthStr.padStart(2, "0");
  const day = dayStr.padStart(2, "0");

  const isoFormatted = `${globalYearSet}-${month}-${day}T${timeStamp[1]}`;
  return new Date(isoFormatted).getTime();
}

// Splits the event into prefix and suffix, validating both parts at once.
function setEvent(event) {
  event = event.split("_");
  if (event.length <= 1) {
    return false;
  }

  for (let i = 0; i < event.length; i++) {
    let prefix = event.slice(0, i).join("");
    let suffix = event.slice(i, 5).join("");
    let specialEvent = event.join("");

    if (VALIDPREFIX.includes(prefix) && VALIDSUFFIX.includes(suffix)) {
      return [prefix, suffix];
    } else if (SPECIALEVENTS.includes(specialEvent) && i === event.length - 1) {
      return ["specialEvent", specialEvent];
    }
  }

  return false;
}

// Parses the flag mask into a simplified affiliation tag for easier handling later in the process.
export function parseAffiliation(flagMask) {
  const decimalFlag = parseInt(flagMask, 16);
  const binaryString = decimalFlag.toString(2).padStart(16, "0");

  const affiliationBits = decimalFlag & 0xf; // Last 4 bits
  const reactionBits = decimalFlag & 0xf0; // Next 4 bits
  const controlBits = decimalFlag & 0xf00; // Third group of 4 bits
  const specialBits = decimalFlag & 0xf000; // Fourth group (special flags)

  const result = {};

  // Affiliation
  result.affiliation = {
    0x1: "MINE",
    0x2: "PARTY",
    0x4: "RAID",
    0x8: "OUTSIDER",
    0xf: "MASK",
  }[affiliationBits];

  // Reaction
  result.reaction = {
    0x10: "FRIENDLY",
    0x20: "NEUTRAL",
    0x40: "HOSTILE",
    0xf0: "MASK",
  }[reactionBits];

  // Control
  result.control = {
    0x100: "PLAYER",
    0x200: "NPC",
    0x300: "MASK",
  }[controlBits];

  // Special Flags
  const specials = [];
  if (specialBits & 0x1000) specials.push("TARGET");
  if (specialBits & 0x2000) specials.push("FOCUS");
  if (specialBits & 0x4000) specials.push("MAINTANK");
  if (specialBits & 0x8000) specials.push("MAINASSIST");

  if (
    ["MINE", "PARTY", "RAID"].includes(result.affiliation) &&
    result.reaction === "FRIENDLY" &&
    result.control === undefined
  ) {
    return "player";
  }

  // Group 2: Friendly pets or minions (controlled NPCs or players)
  if (
    ["MINE", "PARTY", "RAID"].includes(result.affiliation) &&
    result.reaction === "FRIENDLY" &&
    ["PLAYER"].includes(result.control)
  ) {
    return "pet";
  }

  // Group 3: External friendly NPCs (e.g., quest givers, guards)
  if (
    ["OUTSIDER", "MASK"].includes(result.affiliation) &&
    result.reaction === "FRIENDLY" &&
    ["NPC", undefined].includes(result.control)
  ) {
    return "friendlyNPC";
  }

  // Group 4: Enemy players (PvP opponents)
  if (
    ["OUTSIDER", "MASK"].includes(result.affiliation) &&
    result.reaction === "HOSTILE" &&
    result.control === "PLAYER"
  ) {
    return "enemyPlayer";
  }

  // Group 5: Friendly or neutral players not in group (e.g., phased players)
  if (
    ["OUTSIDER", "MASK"].includes(result.affiliation) &&
    ["FRIENDLY", "NEUTRAL"].includes(result.reaction) &&
    result.control === "PLAYER"
  ) {
    return "friendlyPlayer";
  }

  // Group 6: Hostile NPCs (enemies in the world)
  if (
    ["OUTSIDER", "MASK"].includes(result.affiliation) &&
    result.reaction === "HOSTILE" &&
    ["NPC", undefined].includes(result.control)
  ) {
    return "enemyNPC";
  }

  // Group 7: Neutral NPCs (guards, wildlife, quest mobs)
  if (
    ["OUTSIDER", "MASK"].includes(result.affiliation) &&
    result.reaction === "NEUTRAL" &&
    ["NPC", undefined].includes(result.control)
  ) {
    return "neutralNPC";
  }

  // If nothing matches, return the parsed object
  if (!result.affiliation && !result.reaction && !result.control) {
    return "none";
  }
  return "unknown";
}

// Returns the base parameters from the array as an object
export function returnBaseParameters(array) {
  return {
    timeStamp: array[0],
    event: array[1],
    sourceGUID: array[2],
    sourceName: checkName(array[3]),
    sourceFlag: array[4],
    destGUID: array[5],
    destName: checkName(array[6]),
    destFlag: array[7],
  };
}

// Returns the prefix parameters from the array as an object
export function returnPrefixParameters(array, prefix, count) {
  if (prefix === "SWING") {
    {
    }
  } else if (prefix === "RANGE") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: getSchooltype(array[count + 3]),
    };
  } else if (prefix === "SPELL") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: getSchooltype(array[count + 3]),
    };
  } else if (prefix === "SPELLPERIODIC") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: getSchooltype(array[count + 3]),
    };
  } else if (prefix === "SPELLBUILDING") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: getSchooltype(array[count + 3]),
    };
  } else if (prefix === "ENVIRONMENTAL") {
    return { environmentalType: array[count + 1] };
  } else {
    return {};
  }
}

// Returns the suffix parameters from the array as an object
export function returnSuffixParameters(array, suffix, count) {
  if (suffix === "DAMAGE") {
    return {
      amount: checkAmount(array[count + 1]),
      overkill: checkAmount(array[count + 2]),
      school: getSchooltype(array[count + 3]),
      resisted: checkAmount(array[count + 4]),
      blocked: checkAmount(array[count + 5]),
      absorbed: checkAmount(array[count + 6]),
      critical: checkCritGlancingCrushing(array[count + 7]),
      glancing: checkCritGlancingCrushing(array[count + 8]),
      crushing: checkCritGlancingCrushing(array[count + 9]),
    };
  }
  if (
    suffix === "MISSED" &&
    ["BLOCK", "RESIST", "ABSORB"].includes(array[count + 1])
  ) {
    return {
      missType: array[count + 1],
      amount: checkAmount(array[count + 2]),
    };
  } else if (suffix === "MISSED") {
    return { missType: array[count + 1] };
  } else if (suffix === "HEAL") {
    return {
      amount: checkAmount(array[count + 1]),
      overhealing: checkAmount(array[count + 2]),
      absorbed: checkAmount(array[count + 3]),
      critical: checkCritGlancingCrushing(array[count + 4]),
    };
  } else if (suffix === "ENERGIZE") {
    return {
      amount: checkAmount(array[count + 1]),
      powerType: getEnergyType(array[count + 2]),
    };
  } else if (suffix === "DRAIN") {
    return {
      amount: checkAmount(array[count + 1]),
      powerType: getEnergyType(array[count + 2]),
      extraAmount: checkAmount(array[count + 3]),
    };
  } else if (suffix === "LEECH") {
    return {
      amount: checkAmount(array[count + 1]),
      powerType: getEnergyType(array[count + 2]),
      extraAmount: checkAmount(array[count + 3]),
    };
  } else if (suffix === "INTERRUPT") {
    return {
      extraSpellId: array[count + 1],
      extraSpellName: array[count + 2],
      extraSchool: getSchooltype(array[count + 3]),
    };
  } else if (suffix === "DISPELFAILED") {
    return {
      extraSpellId: array[count + 1],
      extraSpellName: array[count + 2],
      extraSchool: getSchooltype(array[count + 3]),
      auraType: checkUndefined(array[count + 4]),
    };
  } else if (suffix === "DISPEL") {
    return {
      extraSpellId: array[count + 1],
      extraSpellName: array[count + 2],
      extraSchool: getSchooltype(array[count + 3]),
      auraType: array[count + 4],
    };
  } else if (suffix === "STOLEN") {
    return {
      extraSpellId: array[count + 1],
      extraSpellName: array[count + 2],
      extraSchool: getSchooltype(array[count + 3]),
      auraType: array[count + 4],
    };
  } else if (suffix === "EXTRAATTACKS") {
    return { amount: checkAmount(array[count + 1]) };
  } else if (suffix === "AURAAPPLIEDDOSE") {
    return {
      auraType: array[count + 1],
      amount: checkAmount(array[count + 2]),
    };
  } else if (suffix === "AURAREMOVEDDOSE") {
    return {
      auraType: array[count + 1],
      amount: checkAmount(array[count + 2]),
    };
  } else if (suffix === "AURAAPPLIED") {
    return { auraType: array[count + 1] };
  } else if (suffix === "AURAREMOVED") {
    return { auraType: array[count + 1] };
  } else if (suffix === "AURAREFRESH") {
    return { auraType: array[count + 1] };
  } else if (suffix === "AURABROKEN_SPELL") {
    return {
      extraSpellId: array[count + 1],
      extraSpellName: array[count + 2],
      extraSchool: array[count + 3],
      auraType: array[count + 4],
    };
  } else if (suffix === "AURABROKEN") {
    return { auraType: array[count + 1] };
  } else if (suffix === "CASTSTART") {
    return {};
  } else if (suffix === "CASTSUCCESS") {
    return {};
  } else if (suffix === "CASTFAILED") {
    return { failedType: array[count + 1] };
  } else if (suffix === "INSTAKILL") {
    return {};
  } else if (suffix === "DURABILITYDAMAGEALL") {
    return {};
  } else if (suffix === "DURABILITYDAMAGE") {
    return {};
  } else if (suffix === "CREATE") {
    return {};
  } else if (suffix === "SUMMON") {
    return {};
  } else if (suffix === "RESURRECT") {
    return {};
  } else if (
    suffix === "DAMAGESHIELDMISSED" &&
    [
      "EVADE",
      "IMMUNE",
      "MISS",
      "DEFLECT",
      "DODGE",
      "PARRY",
      "REFLECT",
    ].includes(array[count + 4])
  ) {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: array[count + 3],
      missType: array[count + 4],
    };
  } else if (suffix === "DAMAGESHIELDMISSED") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      spellSchool: array[count + 3],
      missType: array[count + 4],
      amountMissed: checkAmount(array[count + 5]),
    };
  } else if (suffix === "DAMAGESHIELD") {
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      school: array[count + 3],
      amount: checkAmount(array[count + 4]),
      overkill: checkAmount(array[count + 5]),
      extraSchool: array[count + 6],
      resisted: checkAmount(array[count + 7]),
      blocked: checkAmount(array[count + 8]),
      absorbed: checkAmount(array[count + 9]),
      critical: checkCritGlancingCrushing(array[count + 10]),
      glancing: checkCritGlancingCrushing(array[count + 11]),
      crushing: checkCritGlancingCrushing(array[count + 12]),
    };
  } else if (suffix === "DAMAGESPLIT") {
    console.log(array)
    return {
      spellId: array[count + 1],
      spellName: array[count + 2],
      school: array[count + 3],
      amount: checkAmount(array[count + 4]),
      overkill: checkAmount(array[count + 5]),
      school: array[count + 6],
      resisted: checkAmount(array[count + 7]),
      blocked: checkAmount(array[count + 8]),
      absorbed: checkAmount(array[count + 9]),
      critical: checkCritGlancingCrushing(array[count + 10]),
      glancing: checkCritGlancingCrushing(array[count + 11]),
      crushing: checkCritGlancingCrushing(array[count + 12]),
    };
  } else if (suffix === "ENCHANTAPPLIED") {
    return {
      spellName: array[count + 1],
      itemID: checkUndefined(array[count + 2]),
      itemName: checkUndefined(array[count + 3]),
    };
  } else if (suffix === "ENCHANTREMOVED") {
    return {
      spellName: array[count + 1],
      itemID: checkUndefined(array[count + 2]),
      itemName: checkUndefined(array[count + 3]),
    };
  } else if (suffix === "PARTYKILL") {
    return {};
  } else if (suffix === "UNITDIED") {
    return {};
  } else if (suffix === "UNITDESTROYED") {
    return {};
  } else {
    return false;
  }
}

// Helper functions for value checking and conversion
function checkUndefined(value) {
  if (value === undefined) {
    return "not known";
  }
  return value;
}

// Checks if the value indicates a critical, glancing, or crushing hit
function checkCritGlancingCrushing(value) {
  if (value === "1") {
    return true;
  }
  return false;
}

// Checks and corrects names, replacing "nil" with "None"
function checkName(name) {
  if (name === "nil") {
    return "None";
  }
  return name;
}

// Checks and converts amount values, replacing "nil" with 0
function checkAmount(amount) {
  if (amount === "nil") {
    return 0;
  }
  return parseInt(amount, 10);
}
