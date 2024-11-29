import { VALIDPREFIX, VALIDSUFFIX, SPECIALEVENTS, VALIDDAMAGEPREFIX } from "./constants.js";

export function validateString(string) {
  if (stringToArray(string)) {
    return true;
  } 
  return false;
}

export function flagStringToFlagObject(string){
  // Define flag mappings (using powers of 2, representing each bit)
const FLAG_MAP = {
  // Affiliation flags (First 4 bits)
  AFFILIATION_MINE: 0x01,    // 0x01 = 0001
  AFFILIATION_PARTY: 0x02,   // 0x02 = 0010
  AFFILIATION_RAID: 0x04,    // 0x04 = 0100
  AFFILIATION_OUTSIDER: 0x08, // 0x08 = 1000
  AFFILIATION_MASK: 0x0F,    // 0x0F = 1111 (All affiliation flags)

  // Reaction flags (Next 4 bits)
  REACTION_FRIENDLY: 0x10,    // 0x10 = 0001 0000
  REACTION_NEUTRAL: 0x20,     // 0x20 = 0010 0000
  REACTION_HOSTILE: 0x40,     // 0x40 = 0100 0000
  REACTION_MASK: 0xF0,        // 0xF0 = 1111 0000 (All reaction flags)

  // Control flags (Next 4 bits)
  CONTROL_PLAYER: 0x100,    // 0x100 = 0001 0000 0000
  CONTROL_NPC: 0x200,       // 0x200 = 0010 0000 0000
  CONTROL_MASK: 0x300,      // 0x300 = 0011 0000 0000 (All control flags)

  // Type flags (Next 4 bits)
  TYPE_PLAYER: 0x400,     // 0x400 = 0100 0000 0000
  TYPE_NPC: 0x800,        // 0x800 = 1000 0000 0000
  TYPE_PET: 0x1000,       // 0x1000 = 0001 0000 0000 0000
  TYPE_GUARDIAN: 0x2000,  // 0x2000 = 0010 0000 0000 0000
  TYPE_OBJECT: 0x4000,    // 0x4000 = 0100 0000 0000 0000
  TYPE_MASK: 0xF000,      // 0xF000 = 1111 0000 0000 0000 (All type flags)

  // Special Flags (Remaining 4 bits)
  TARGET: 0x10000,    // 0x10000 = 0001 0000 0000 0000 0000
  FOCUS: 0x20000,     // 0x20000 = 0010 0000 0000 0000 0000
  MAINTANK: 0x40000,  // 0x40000 = 0100 0000 0000 0000 0000
  MAINASSIST: 0x80000, // 0x80000 = 1000 0000 0000 0000 0000
  NONE: 0x800000,     // 0x800000 = 1000 0000 0000 0000 0000 0000
  SPECIAL_MASK: 0xFFFF0000, // Special Flags Mask
};

// Function to convert hex to binary and extract the flag information
function parseCombatLogFlag(hexFlag) {
  // Convert the hex flag to an integer and then to a binary string (16-bit padded)
  let binaryFlag = parseInt(hexFlag, 16).toString(2).padStart(16, '0');
  
  // Extract each flag category from the binary string
  let affiliation = parseInt(binaryFlag.slice(0, 4), 2); // First 4 bits for affiliation
  let reaction = parseInt(binaryFlag.slice(4, 8), 2);    // Next 4 bits for reaction
  let control = parseInt(binaryFlag.slice(8, 12), 2);     // Next 4 bits for control
  let type = parseInt(binaryFlag.slice(12, 16), 2);       // Last 4 bits for type
  
  // Prepare the output with flag names
  const flagDetails = {
      affiliation: getFlagNames(affiliation, FLAG_MAP.AFFILIATION_MINE, FLAG_MAP.AFFILIATION_PARTY, FLAG_MAP.AFFILIATION_RAID, FLAG_MAP.AFFILIATION_OUTSIDER),
      reaction: getFlagNames(reaction, FLAG_MAP.REACTION_FRIENDLY, FLAG_MAP.REACTION_NEUTRAL, FLAG_MAP.REACTION_HOSTILE),
      control: getFlagNames(control, FLAG_MAP.CONTROL_PLAYER, FLAG_MAP.CONTROL_NPC),
      type: getFlagNames(type, FLAG_MAP.TYPE_PLAYER, FLAG_MAP.TYPE_NPC, FLAG_MAP.TYPE_PET, FLAG_MAP.TYPE_GUARDIAN, FLAG_MAP.TYPE_OBJECT),
      special: getSpecialFlags(binaryFlag.slice(16)) // For special flags
  };

  console.log(flagDetails);

  return flagDetails;
}

// Helper function to get flag names from bit values
function getFlagNames(bitValue, ...flagValues) {
  let flagNames = [];
  flagValues.forEach((flagValue, index) => {
      if ((bitValue & (1 << index)) !== 0) {
          flagNames.push(Object.keys(FLAG_MAP)[index]);
      }
  });
  return flagNames;
}

// Helper function to extract special flags
function getSpecialFlags(specialBinary) {
  let specialFlags = [];
  if (specialBinary[0] === '1') specialFlags.push('TARGET');
  if (specialBinary[1] === '1') specialFlags.push('FOCUS');
  if (specialBinary[2] === '1') specialFlags.push('MAINTANK');
  if (specialBinary[3] === '1') specialFlags.push('MAINASSIST');
  if (specialBinary[4] === '1') specialFlags.push('NONE');
  return specialFlags;
}

}

export function stringToObject(string) {

const array = stringToArray(string);
const event = findPrefixAndSuffix(array[2]);
let prefix;
let suffix;

  if (event[0] && event[1]) {
    array[2] = event[0] + event[1];
    prefix = event[0];
    suffix = event[1];
  } else if (prefix) {
    
  } else {
    return array;
  }

let count = 8;

const baseParameters = returnBaseParameters(array);
let prefixParameters;
let suffixParameters;

if (event[0]) {
  prefixParameters = returnPrefixParameters(array, prefix, count);
  if (prefixParameters !== undefined){
    count += Object.keys(prefixParameters).length;
  }
  if (event[1]) {
    suffixParameters = returnSuffixParameters(array, suffix, count);
  }
} else {
  return array;
}

return { ...baseParameters, ...prefixParameters, ...suffixParameters };
}

export function stringDamageEventCheck(string) {
  const array = stringToArray(string);
  const event = findPrefixAndSuffix(array[2]);
  const prefix = event[0];
  const suffix = event[1];
  if (VALIDDAMAGEPREFIX.includes(prefix) && suffix === "DAMAGE") {
    return true;
  } else {
    return false;
  }
}

export function rawParseToTimeMs(string){
let array = stringToArray(string);
return timeStampMs(array[1]);
}

export function rawParseToDate(string){
  let array;
  if (stringToArray(string)) {
    array = stringToArray(string);
  } else {
    return false;
  }
  if (array[1]) {
    return timeStampMs(array[1]);
  } else {
    return false;
  }
}

export function checkFlag(flag){
  
}

//SUPPORTIVE HELPER FUNCTIONS

export function stringToArray(input) { // GOLDEN FUNCTION
  if (typeof input === "string") {
    const commaCount = (input.match(/,/g) || []).length;
    const doubleSpaceCount = (input.match(/  /g) || []).length;

    if (commaCount > 4 && doubleSpaceCount === 1) {
      let parts = input.split("  ");
      let part1 = parts[0].split(" ");
      let part2 = parts[1].split(",");

      return [...part1, ...part2].map(str => str.replace(/["\\\r]/g, ''));
    }
  }
  
  return false;
}

function validateFlag(string){
  if (string === "0x") {
    return true;
  } else {
    return false;
  }
}

  function formatHexToBinary(hex) {
    // Convert the hex value to an integer
    const decimalValue = parseInt(hex, 16);

    // Convert the integer to a binary string
    let binaryString = decimalValue.toString(2);

    // Pad the binary string to 16 bits (if necessary)
    binaryString = binaryString.padStart(16, '0');

    // Group the binary string into nibbles (groups of 4 bits)
    const binaryArray = binaryString.match(/.{1,4}/g); // This groups the string into chunks of 4 bits

    return binaryArray;
}


//+ Converts the time to milliseconds
export function timeStampMs(time) {
  let timeArray = time.split(/[:.]/)
  let hours = parseInt(timeArray[0]) * 3600000;
  let minutes = parseInt(timeArray[1]) * 60000;
  let seconds = parseInt(timeArray[2]) * 1000;
  let milliseconds = parseInt(timeArray[3]);
  const timeSum =+ hours + minutes + seconds + milliseconds;
  return timeSum ;
}

//+ Splits the date into an array
export function splitDate(date) {
  let dateArray = date.split("/");
  let month = parseInt(dateArray[0]);
  let day = parseInt(dateArray[1]);
  return [month, day];
}


//Finds the Prefix and Suffix of the event (Suffix is whats left over after the prefix)
export function findPrefixAndSuffix(event) {

  let check = event.split('_');

  if (check.length > 1) {
  } else {
    return false;
  }
  for (let i = 0; i < check.length; i++) {
    let prefix = check.slice(0, i).join('');
    let suffix = check.slice(i, 5).join('');
    let specialEvent = check.join('');
    if (VALIDPREFIX.includes(prefix) && VALIDSUFFIX.includes(suffix)){
      return [prefix, suffix];
    } else if (SPECIALEVENTS.includes(specialEvent) && i === check.length - 1){
      return specialEvent;
    }
  }

  // If no valid prefix/suffix found, return empty array or handle it as needed
  return false;
}

export function findDayTime(string){
  const array = stringToArray(string);
  const date = splitDate(array[0]);
  const timeMs = timeStampMs(array[1]);
  const newDayTime = [date, timeMs]; 

}


//-----------------OBJECT RETURNS-----------------//




export function returnBaseParameters (array){
  return {
    date: splitDate(array[0]),
    timeMs: timeStampMs(array[1]),
    event: array[2],
    sourceGUID: array[3],
    sourceName: array[4],
    sourceFlags: array[5],
    destGUID: array[6],
    destName: array[7],
    destFlags: array[8],
    };
}

export function returnPrefixParameters(array, prefix, count){
  if (prefix === "SWING") { { } }
  if (prefix === "RANGE") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3] }}
  if (prefix === "SPELL") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3] }}
  if (prefix === "SPELLPERIODIC") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3] }}
  if (prefix === "SPELLBUILDING") {  return { spellId: array[count+1], spellName: array[count+2], school: array[count+3] }}
  if (prefix === "ENVIRONMENTAL") {  return { environmentalType: array[count+1] }}
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
  if (suffix === "DAMAGE") { return { amount: array[count+1], overkill: array[count+2], school: array[count+3], resisted: array[count+4], blocked: array[count+5], absorbed: array[count+6], critical: array[count+7], glancing: array[count+8], crushing: array[count+9] }}
  if (suffix === "MISSED") { return { missType: array[count+1], amountMissed: array[count+2] }}
  if (suffix === "HEAL") { return { amount: array[count+1], overhealing: array[count+2], absorbed: array[count+3], critical: array[count+4] }}
  if (suffix === "ENERGIZE") {  return { amount: array[count+1], powerType: array[count+2] }}
  if (suffix === "DRAIN") { return { amount: array[count+1], powerType: array[count+2], extraAmount: array[count+3] }}
  if (suffix === "LEECH") { return { amount: array[count+1], powerType: array[count+2], extraAmount: array[count+3] }}
  if (suffix === "INTERRUPT") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: array[count+3] }}
  if (suffix === "DISPELFAILED") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: array[count+3], auraType: array[count+4] }}
  if (suffix === "DISPEL") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: array[count+3] }}
  if (suffix === "STOLEN") { return { extraSpellId: array[count+1], extraSpellName: array[count+2], extraSchool: array[count+3], auraType: array[count+4] }}
  if (suffix === "EXTRAATTACKS") { return { amount: array[count+1] }}
  if (suffix === "AURAAPPLIEDDOSE") { return { auraType: array[count+1], amount: array[count+2] }}
  if (suffix === "AURAREMOVEDDOSE") { return { auraType: array[count+1], amount: array[count+2] }}
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
  if (specialEvent === "DAMAGESHIELDMISSED") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], missType: array[count+4], amountMissed: array[count+5] }}
  if (specialEvent === "DAMAGESHIELD") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: array[count+4], overkill: array[count+5], school: array[count+6], resisted: array[count+7], blocked: array[count+8], absorbed: array[count+9], critical: array[count+10], glancing: array[count+11], crushing: array[count+12] }}
  if (specialEvent === "DAMAGESPLIT") { return { spellId: array[count+1], spellName: array[count+2], school: array[count+3], amount: array[count+4], overkill: array[count+5], school: array[count+6], resisted: array[count+7], blocked: array[count+8], absorbed: array[count+9], critical: array[count+10], glancing: array[count+11], crushing: array[count+12] }}
  if (specialEvent === "ENCHANTAPPLIED") { return { spellName: array[count+1], itemID: array[count+2], itemName: array[count+3] }}
  if (specialEvent === "ENCHANTREMOVED") { return { spellName: array[count+1], itemID: array[count+2], itemName: array[count+3] }}
  if (specialEvent === "PARTYKILL") { return {}}
  if (specialEvent === "UNITDIED") { return {}}
  if (specialEvent === "UNITDESTROYED") { return {}}
  else { return false }
}