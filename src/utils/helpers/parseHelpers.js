import { findPrefixAndSuffix, returnBaseParameters, returnPrefixParameters, returnSuffixParameters, splitParseStringToArray, stringToPrefix, stringToSuffix, timeStampMs, splitDate } from "./parseHelpers.js";
import { VALIDPREFIX, VALIDSUFFIX, SPECIALEVENTS } from "./constants.js";

export function validateParse(string) {
  let array;
  if (splitParseStringToArray(string)) {
    array = splitParseStringToArray(string);
    if (findPrefixAndSuffix(array)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export function getTimestamp(string) {
  if (!validateParse(string)) {
    return false;
  }
  const array = splitParseStringToArray(string);
  return array;
}

export function objectifyParse(string) {

  if (!validateParse(string)) {
    return false;
  }

const array = splitParseStringToArray(string);
const event = findPrefixAndSuffix(array);
const prefix = event[0];
const suffix = event[1];

  if (!suffix) {
    array[2] = prefix;
  } else if (suffix === false) {
    array[2] = event.join("");
  } else {
    return false
  }

let count = 8

const baseParameters = returnBaseParameters(array);
let prefixParameters;
let suffixParameters;

if (event){
  prefixParameters = returnPrefixParameters(array, prefix, count);
  if (prefixParameters !== undefined){
    count += Object.keys(prefixParameters).length;
  }
  if (suffix) {
    suffixParameters = returnSuffixParameters(array, suffix, count);
  }
} else {
  return array;
}

return { ...baseParameters, ...prefixParameters, ...suffixParameters };
}

export function validateParseDamageInstance(string) {
  const prefix = stringToPrefix(string);
  const suffix = stringToSuffix(string);
  if (VALIDDAMAGEPREFIX.includes(prefix) && suffix === "DAMAGE") {
    return true;
  } else {
    return false;
  }
}

export function stringToTimestamp(string){
  let array;
  if (splitParseStringToArray(string)) {
    array = splitParseStringToArray(string);
  } else {
    return false;
  }
  if (array[1]) {
    return timeStampMs(array[1]);
  } else {
    return false;
  }
}

export function stringToDate(string){
  let array;
  if (splitParseStringToArray(string)) {
    array = splitParseStringToArray(string);
  } else {
    return false;
  }
  if (array[1]) {
    return timeStampMs(array[1]);
  } else {
    return false;
  }
}

//Returns split date + time stamp in ms + source guid + source name + damage instance true/false
export function stringToCheckSession(string){
  const array = splitParseStringToArray(string);
  return [splitDate(array[0]) ,timeStampMs(array[1]), array[3], array[4], validateParseDamageInstance(string)];
}

//-----------------VALIDATION FUNCTIONS-----------------//

export function checkFlag(flag){
  
}


//----------------STRING FUNCTIONS-----------------//


export function StringToTimeStampMs(string) {
    let array;
    if (splitParseStringToArray(string)) {
      array = splitParseStringToArray(string);
    } else {
      return false;
    }
    if (array[1]) {
      return timeStampMs(array[1]);
    } else {
      return false;
    }
}

export function stringToPrefix(string){
    let array;
    if (splitParseStringToArray(string)) {
        array = splitParseStringToArray(string);
    } else {
        return false;
    }

    if (array[2]) {
      if (findPrefixAndSuffix(array)) {
        const event = findPrefixAndSuffix(array)
        return event[0];
      } else {
        return false;
      }
    } else {
        return false;
    }
}

export function stringToSuffix(string){
  let array;

  if (splitParseStringToArray(string)) {
      array = splitParseStringToArray(string);
  } else {
      return false;
  }

  if (array[2]) {

    if (findPrefixAndSuffix(array)) {
      const event = findPrefixAndSuffix(array)

      if (event[1]){
        return event[1];
      } else {
        return false;
      }
      
    } else {
      return false;
    }
  } else {
      return false;
  }
}

export function stringToDate(string){
  let array;
  if (splitParseStringToArray(string)) {
    array = splitParseStringToArray(string);
  } else {
    return false;
  }
  if (array[0]) {
    return splitDate(array[0]);
  } else {
    return false;
  }
}


//-----------------ARRAY FUNCTIONS-----------------//



//+ Splits the parse string to a parse array
export function splitParseStringToArray(input) {
  if (typeof input === "string") {
    const commaCount = (input.match(/,/g) || []).length;
    const doubleSpaceCount = (input.match(/  /g) || []).length;

    if (commaCount > 4 && doubleSpaceCount === 1) {
      let parts = input.split("  ");
      let part1 = parts[0].split(" ");
      let part2 = parts[1].split(",");

      return [...part1, ...part2].map(str => str.replace(/["\\]/g, ''));
    }
  }
  
  return false;
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
export function findPrefixAndSuffix(array) {
let check = '';

if(array[2].split('_')){
  check = array[2].split('_');
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
      return [specialEvent, false];
    }
  }

  // If no valid prefix/suffix found, return empty array or handle it as needed
  return false;
}

export function findDayTime(string){
  const array = splitParseStringToArray(string);
  const date = splitDate(array[0]);
  const timeMs = timeStampMs(array[1]);
  const newDayTime = [date, timeMs]; 

}


//-----------------Object FUNCTIONS-----------------//




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