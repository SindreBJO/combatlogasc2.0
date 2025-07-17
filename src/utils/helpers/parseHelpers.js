import { VALIDPREFIX, VALIDSUFFIX, SPECIALEVENTS, VALIDDAMAGEPREFIX, getEnergyType, getSchooltype } from "./constants.js";

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


let globalYearSet;
export function setGlobalYear(year) { globalYearSet = year }

export function testArrayLength(string) {

    if (typeof string !== "string") { return false }

    let parseArray = validateAndSplitParse(string)
    if (parseArray === false) { return false }

    parseArray[0] = setTimeUnix(parseArray[0])
    if (parseArray[0] === false) { return false }

    parseArray[1] = setEvent(parseArray[1])
    if (parseArray[1] === false) { return false }
    parseArray[1] = parseArray[1].join('_');
    return [parseArray.length, parseArray];
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


//Step 2 preparing return Object

  const baseParameters = returnBaseParameters(parseArray);

  let indexCount = 7; // 8 base values, used to guide the selection of the next values
  let prefixParameters = returnPrefixParameters(parseArray, parseArray[1][0], indexCount);
  indexCount += Object.keys(prefixParameters).length;
  let suffixParameters = returnSuffixParameters(parseArray, parseArray[1][1], indexCount);
  return { 
  ...baseParameters, 
  ...(prefixParameters), 
  ...suffixParameters 
}





}




function validateAndSplitParse(string) {
  if (typeof string === "string") {

    const commaCount = (string.match(/,/g) || []).length
    const doubleSpaceCount = (string.match(/  /g) || []).length

    if (commaCount > 4 && doubleSpaceCount === 1) {

      let parts = string.split("  ")
      let part1 = parts[0].split(" ")
      let part2 = parts[1].split(/,(?! )/);

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

    if (VALIDPREFIX.includes(prefix) && VALIDSUFFIX.includes(suffix)){
    
      return [prefix, suffix] 
    } 
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

  // Early return for unknown
  if (!result.affiliation && !result.reaction && !result.control) {
    return "None";
  }

  // Classification


if (["MINE","RAID","PARTY"].includes(result.affiliation) && result.reaction === "FRIENDLY" && result.control === undefined) { return "Player" }
if (["MINE","RAID","PARTY"].includes(result.affiliation) && result.reaction === "FRIENDLY" && result.control === "PLAYER") { return "Unknown" }
if (["MINE","RAID","PARTY"].includes(result.affiliation) && result.reaction === "FRIENDLY" && ["NPC"].includes(result.control)) { return "Pet" }
if (["OUTSIDER","MASK"].includes(result.affiliation) && result.reaction === "FRIENDLY" && ["NPC", undefined].includes(result.control)) { return "FriendlyNPC" }
if (["OUTSIDER","MASK"].includes(result.affiliation) && result.reaction === "HOSTILE" && ["PLAYER"].includes(result.control)) { return "EnemyPlayer" }
if (["OUTSIDER","MASK"].includes(result.affiliation) && ["FRIENDLY", "NEUTRAL"].includes(result.reaction) && ["PLAYER"].includes(result.control)) { return "FriendlyPlayer" }
if (["OUTSIDER","MASK"].includes(result.affiliation) && result.reaction === "HOSTILE" && ["NPC", undefined].includes(result.control)) { return "EnemyNPC" }
if (["OUTSIDER","MASK"].includes(result.affiliation) && result.reaction === "NEUTRAL" && ["NPC", undefined].includes(result.control)) { return "NeutralNPC" }
console.log("FUCK")
  // If nothing matches, return the parsed object
  return "Unknown";
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
  if (prefix === "RANGE") { return { spellId: array[count+1], spellName: array[count+2], spellSchool: getSchooltype(array[count+3]) }}
  if (prefix === "SPELL") { return { spellId: array[count+1], spellName: array[count+2], spellSchool: getSchooltype(array[count+3]) }}
  if (prefix === "SPELLPERIODIC") { return { spellId: array[count+1], spellName: array[count+2], spellSchool: getSchooltype(array[count+3]) }}
  if (prefix === "SPELLBUILDING") { return { spellId: array[count+1], spellName: array[count+2], spellSchool: getSchooltype(array[count+3]) }}
  if (prefix === "ENVIRONMENTAL") { return { environmentalType: array[count+1] }}
  else { return false }
}

export function returnSuffixParameters(array, suffix, count){

  if (suffix === "DAMAGE") { return { amount: checkAmount(array[count+1]), overkill: checkAmount(array[count+2]), school: getSchooltype(array[count+3]), resisted: checkAmount(array[count+4]), blocked: checkAmount(array[count+5]), absorbed: checkAmount(array[count+6]), critical: checkCritGlancingCrushing(array[count+7]), glancing: checkCritGlancingCrushing(array[count+8]), crushing: checkCritGlancingCrushing(array[count+9]) }}
  if (suffix === "MISSED" && ["BLOCK", "RESIST", "ABSORB"].includes((array[count+1]))) { return { missType: array[count+1], amount: checkAmount(array[count+1]) }}
  if (suffix === "MISSED") { return { missType: array[count+1] }}
  if (suffix === "HEAL") { return { amount: checkAmount(array[count+1]), overhealing: checkAmount(array[count+2]), absorbed: checkAmount(array[count+3]), critical: checkCritGlancingCrushing(array[count+4]) }}
  if (suffix === "ENERGIZE") {  return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]) }}
  if (suffix === "DRAIN") { return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]), extraAmount: checkAmount(array[count+3]) }}
  if (suffix === "LEECH") { return { amount: checkAmount(array[count+1]), powerType: getEnergyType(array[count+2]), extraAmount: checkAmount(array[count+3]) }}
  if (suffix === "INTERRUPT") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]) }}
  if (suffix === "DISPELFAILED") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]), auraType: checkUndefined(array[count+4]) }}
  if (suffix === "DISPEL") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: getSchooltype(array[count+3]), auraType: array[count+4] }}
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
  if (suffix === "DAMAGESHIELDMISSED" && ["EVADE", "IMMUNE", "MISS", "DEFLECT", "DODGE", "PARRY", "REFLECT" ].includes((array[count+4]))) { return { spellId: array[count+1], spellName: array[count+2], spellSchool: array[count+3], missType: array[count+4] }}
  if (suffix === "DAMAGESHIELDMISSED") { return { spellId: array[count+1], spellName: array[count+2], spellSchool: array[count+3], missType: array[count+4], amountMissed: checkAmount(array[count+5]) }}
  if (suffix === "DAMAGESHIELD") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: checkAmount(array[count+4]), overkill: checkAmount(array[count+5]), extraSchool: array[count+6], resisted: checkAmount(array[count+7]), blocked: checkAmount(array[count+8]), absorbed: checkAmount(array[count+9]), critical: checkCritGlancingCrushing(array[count+10]), glancing: checkCritGlancingCrushing(array[count+11]), crushing: checkCritGlancingCrushing(array[count+12]) }}
  if (suffix === "DAMAGESPLIT") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: checkAmount(array[count+4]), overkill: checkAmount(array[count+5]), school: array[count+6], resisted: checkAmount(array[count+7]), blocked: checkAmount(array[count+8]), absorbed: checkAmount(array[count+9]), critical: checkCritGlancingCrushing(array[count+10]), glancing: checkCritGlancingCrushing(array[count+11]), crushing: checkCritGlancingCrushing(array[count+12]) }}
  if (suffix === "ENCHANTAPPLIED") { return { spellName: array[count+1], itemID: checkUndefined(array[count+2]), itemName: checkUndefined(array[count+3]) }}
  if (suffix === "ENCHANTREMOVED") { return { spellName: array[count+1], itemID: checkUndefined(array[count+2]), itemName: checkUndefined(array[count+3]) }}
  if (suffix === "PARTYKILL") { return {}}
  if (suffix === "UNITDIED") { return {}}
  if (suffix === "UNITDESTROYED") { return {}}
  else { return false }
}

function checkUndefined(value) {
  if (value === undefined) {
    return "not known";
  }
  return value;
}

function checkCritGlancingCrushing(value) {
  if (value === "1") {
    return true;
  }
  return false;
}

function checkName(name){
  if (name === "nil") {
    return "None";
  }
  return name;
}

function checkAmount(amount){
  if (amount === "nil") {
    return 0;
  }
  return parseInt(amount, 10);
}