import { VALIDPREFIX, VALIDSUFFIX, SPECIALEVENTS, VALIDDAMAGEPREFIX, getEnergyType, getSchooltype } from "./constants.js";

// The string goes through 2 sets of processing here:

// 1. Fromat an array that can continue the parsing process, these are 8 of the base values all strings should have
//    a. Validate that there is a sufficent number of parts of data in the string and that the string is formatted correctly
//    b. The event is split into prefix and suffix
//    c. Assuming the log is from the current year, the date and time are converted to a new Date() format
//    d. The source and destination flags are parsed to a tag that directly states the affiliation to the player
//          Array format:
//          [0] = time [ms since jan 1st 1970 00:00:00 UTC]
//          [1] = event [prefix and suffix]
//          [2] = sourceGUID
//          [3] = sourceName
//          [4] = sourceFlags
//          [5] = destGUID
//          [6] = destName
//          [7] = destFlags

// Worth to mention:
// If a parse fails, false is returned in dataContext
// If a parse is a empty string "", when handeling invalid string in dataContext "\r" is returned due to the .txt format
// The last line of the file is always empty
// All of the above mentions are corrected after return in dataContext.js
// Special event is tagged with "specialEvent" as prefix and the event name as suffix
// Source and destination flags are tagged with a specific statement that clearly states the affiliation to the player in a simple matter going forward

// 2. Parse the array into an object that can be stored in metadata
//    
//    


let globalYearSet;
export function setGlobalYear(year) {globalYearSet = year; 
  console.log("globalYearSet", globalYearSet)
}


export function parseString(string) {

  //Step 1 preparing Array

  if (typeof string !== "string") { return false }

  let parseArray = validateAndSplitParse(string)
  if (parseArray === false) { return false }

  parseArray[0] = setTimeUnix(parseArray[0])
  if (parseArray[0] === false) { return false }

  parseArray[1] = setEvent(parseArray[1])
  if (parseArray[1] === false) { return false }

  parseArray[4] = parseAffiliation(parseArray[4])
  if (parseArray[4] === false) { return false }

  parseArray[7] = parseAffiliation(parseArray[7])
  if (parseArray[7] === false) { return false }

//Step 2 preparing Object

  const baseParameters = returnBaseParameters(parseArray);

  let indexCount = 7; // 8 base values, used to guide the selection of the next values
  let prefixParameters = returnPrefixParameters(parseArray, parseArray[1][0], indexCount);
  let suffixParameters = returnSuffixParameters(parseArray, parseArray[1][1], indexCount);

  return { ...baseParameters, ...prefixParameters, ...suffixParameters, isValid: true };




}




function validateAndSplitParse(string) {
  if (typeof string === "string") {

    const commaCount = (string.match(/,/g) || []).length
    const doubleSpaceCount = (string.match(/  /g) || []).length

    if (commaCount > 4 && doubleSpaceCount === 1) {

      let parts = string.split("  ")
      let part1 = parts[0].split(" ")
      let part2 = parts[1].split(",")

      if ([...part1, ...part2].length < 8) { return false }
      return [[...part1], ...part2.map(str => str.replace(/\r/g, ''))]
    }
  }
  
  return false
}

function setTimeUnix(timeStamp) {

  const [monthStr, dayStr] = timeStamp[0].split("/")
  const month = monthStr.padStart(2, '0')
  const day = dayStr.padStart(2, '0')

  const isoFormatted = `${globalYearSet}-${month}-${day}T${timeStamp[1]}`
  return new Date(isoFormatted).getTime()
}

function setEvent(event) {

  event = event.split('_')
  if (event.length <= 1) { return false }

  for (let i = 0; i < event.length; i++) {

    let prefix = event.slice(0, i).join('')
    let suffix = event.slice(i, 5).join('')
    let specialEvent = event.join('')

    if (VALIDPREFIX.includes(prefix) && VALIDSUFFIX.includes(suffix)){ return [prefix, suffix] } 
    else if (SPECIALEVENTS.includes(specialEvent) && i === event.length - 1){ return ["specialEvent", specialEvent] }
  }

  return false
}































export function parseAffiliation(flagMask) {
  const decimalFlag = parseInt(flagMask, 16);
  const binaryString = decimalFlag.toString(2).padStart(16, '0');

  const affiliationBits = decimalFlag & 0xF;    // Last 4 bits
  const reactionBits    = decimalFlag & 0xF0;   // Next 4 bits
  const controlBits     = decimalFlag & 0xF00;  // Third group of 4 bits
  const specialBits     = decimalFlag & 0xF000; // Fourth group (special flags)

  const result = {};

  // Affiliation
  result.affiliation = {
    0x1: 'MINE',
    0x2: 'PARTY',
    0x4: 'RAID',
    0x8: 'OUTSIDER',
    0xF: 'MASK'
  }[affiliationBits];

  // Reaction
  result.reaction = {
    0x10: 'FRIENDLY',
    0x20: 'NEUTRAL',
    0x40: 'HOSTILE',
    0xF0: 'MASK'
  }[reactionBits];

  // Control
  result.control = {
    0x100: 'PLAYER',
    0x200: 'NPC',
    0x300: 'MASK'
  }[controlBits];

  // Special Flags
  const specials = [];
  if (specialBits & 0x1000) specials.push("TARGET");
  if (specialBits & 0x2000) specials.push("FOCUS");
  if (specialBits & 0x4000) specials.push("MAINTANK");
  if (specialBits & 0x8000) specials.push("MAINASSIST");
  result.special = specials.length ? specials : undefined;

  // Early return for unknown
  if (!result.affiliation && !result.reaction && !result.control) {
    return "Unknown";
  }

  // Classification
  const { affiliation, reaction, control } = result;

if (["MINE", "RAID", "PARTY"].includes(result.affiliation) && result.reaction === "FRIENDLY" && result.control !== "PLAYER") {
    return "Player";
} else if (["MINE", "RAID", "PARTY"].includes(result.affiliation) && result.reaction === "FRIENDLY" && result.control === "PLAYER") {
    return "Pet";
} else if (["OUTSIDER", "MASK"].includes(result.affiliation) && result.reaction === "FRIENDLY") {
    return "FriendlyNPC";
} else if (["OUTSIDER", "MASK"].includes(result.affiliation) && result.reaction === "HOSTILE") {
    return "HostileNPC";
} else if (["OUTSIDER", "MASK"].includes(result.affiliation) && result.reaction === "NEUTRAL") {
    return "NeutralNPC";
} else if (result.affiliation === "0") {
    return "Unknown";
}

  // If nothing matches, return the parsed object
  return result;
}

export function damageEventCheck(parsedEvent) {
  const prefix = parsedEvent[0];
  const suffix = parsedEvent[1];

  if (VALIDDAMAGEPREFIX.includes(prefix) && ["DAMAGE", "MISS"].includes(suffix)) {
    return true;
  }
  return false;
}

export function returnBaseParameters (array){

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

export function returnPrefixParameters(array, prefix, count){

  if (prefix === "SWING") { { } }
  if (prefix === "RANGE") { return { spellId: array[count+1], spellName: array[count+2], school: getSchooltype(array[count+3]) }}
  if (prefix === "SPELL") { return { spellId: array[count+1], spellName: array[count+2], school: getSchooltype(array[count+3]) }}
  if (prefix === "SPELLPERIODIC") { return { spellId: array[count+1], spellName: array[count+2], school: getSchooltype(array[count+3]) }}
  if (prefix === "SPELLBUILDING") { return { spellId: array[count+1], spellName: array[count+2], school: getSchooltype(array[count+3]) }}
  if (prefix === "ENVIRONMENTAL") { return { environmentalType: array[count+1] }}
  else { 

    const result = returnSpecialEventParameters(array, prefix, count);
    if (result) {
      return result;
    } else {
      return false;
    }
  }
}

export function returnSuffixParameters(array, suffix, count){

  if (suffix === "DAMAGE") { return { amount: checkAmount(array[count+1]), overkill: checkAmount(array[count+2]), school: getSchooltype(array[count+3]), resisted: checkAmount(array[count+4]), blocked: checkAmount(array[count+5]), absorbed: checkAmount(array[count+6]), critical: checkCritGlancingCrushing(array[count+7]), glancing: checkCritGlancingCrushing(array[count+8]), crushing: checkCritGlancingCrushing(array[count+9]) }}
  if (suffix === "MISSED") { return { missType: array[count+1], amountMissed: checkAmount(array[count+2]) }}
  if (suffix === "HEAL") { return { amount: checkAmount(array[count+1]), overhealing: checkAmount(array[count+2]), absorbed: checkAmount(array[count+3]), critical: checkCritGlancingCrushing(array[count+4]) }}
  if (suffix === "ENERGIZE") {  return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]) }}
  if (suffix === "DRAIN") { return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]), extraAmount: checkAmount(array[count+3]) }}
  if (suffix === "LEECH") { return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]), extraAmount: checkAmount(array[count+3]) }}
  if (suffix === "INTERRUPT") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]) }}
  if (suffix === "DISPELFAILED") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]), auraType: array[count+4] }}
  if (suffix === "DISPEL") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]) }}
  if (suffix === "STOLEN") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]), auraType: array[count+4] }}
  if (suffix === "EXTRAATTACKS") { return { amount: checkAmount(array[count+1]) }}
  if (suffix === "AURAAPPLIEDDOSE") { return { auraType: array[count+1], amount: checkAmount(array[count+2]) }}
  if (suffix === "AURAREMOVEDDOSE") { return { auraType: array[count+1], amount: checkAmount(array[count+2]) }}
  if (suffix === "AURAAPPLIED") { return { auraType: array[count+1] }}
  if (suffix === "AURAREMOVED") { return { auraType: array[count+1] }}
  if (suffix === "AURAREFRESH") {  return { auraType: array[count+1] }}
  if (suffix === "AURABROKEN_SPELL") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: array[count+3], auraType: array[count+4] }}
  if (suffix === "AURABROKEN") { return { auraType: array[count+1] }}
  if (suffix === "CASTSTART") { return {}}
  if (suffix === "CASTSUCCESS") { return {}}
  if (suffix === "CASTFAILED") { return {failedType: array[count+1] }}
  if (suffix === "INSTAKILL") { return {}}
  if (suffix === "DURABILITYDAMAGEALL") { return {}}
  if (suffix === "DURABILITYDAMAGE") { return {}}
  if (suffix === "CREATE") { return {}}
  if (suffix === "SUMMON") { return {}}
  if (suffix === "RESURRECT") { return {}}
  else { return false }
}

function returnSpecialEventParameters(array, specialEvent, count){

  if (specialEvent === "DAMAGESHIELDMISSED") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], missType: array[count+4], amountMissed: checkAmount(array[count+5]) }}
  if (specialEvent === "DAMAGESHIELD") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: checkAmount(array[count+4]), overkill: checkAmount(array[count+5]), school: array[count+6], resisted: checkAmount(array[count+7]), blocked: checkAmount(array[count+8]), absorbed: checkAmount(array[count+9]), critical: checkCritGlancingCrushing(array[count+10]), glancing: checkCritGlancingCrushing(array[count+11]), crushing: checkCritGlancingCrushing(array[count+12]) }}
  if (specialEvent === "DAMAGESPLIT") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: checkAmount(array[count+4]), overkill: checkAmount(array[count+5]), school: array[count+6], resisted: checkAmount(array[count+7]), blocked: checkAmount(array[count+8]), absorbed: checkAmount(array[count+9]), critical: checkCritGlancingCrushing(array[count+10]), glancing: checkCritGlancingCrushing(array[count+11]), crushing: checkCritGlancingCrushing(array[count+12]) }}
  if (specialEvent === "ENCHANTAPPLIED") { return { spellName: array[count+1], itemID: array[count+2], itemName: array[count+3] }}
  if (specialEvent === "ENCHANTREMOVED") { return { spellName: array[count+1], itemID: array[count+2], itemName: array[count+3] }}
  if (specialEvent === "PARTYKILL") { return {}}
  if (specialEvent === "UNITDIED") { return {}}
  if (specialEvent === "UNITDESTROYED") { return {}}
  else { return false }
}

function checkCritGlancingCrushing(value) {
  if (value === "1") {
    return true;
  }
  return false;
}

function checkName(name){
  if (name === "nil") {
    return "Unknown";
  }
  return name;
}

function checkAmount(amount){
  if (["nil", undefined].includes(amount)) {
    return 0;
  }
  return parseInt(amount, 10);
}