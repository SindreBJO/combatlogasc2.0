import { VALIDPREFIX, VALIDSUFFIX, SPECIALEVENTS, VALIDDAMAGEPREFIX, getEnergyType, getSchooltype } from "./constants.js";

export function parseString(string) {

  const array = tryStringToArray(string);

  if (array === false) {

    console.log("Invalid string: " + string);
    return false;

  }

  const event = findPrefixAndSuffix(array[2]);

  let prefix;
  let suffix;

    if(event[0] && event[1]) {

      array[2] = [event[0], event[1]];
      prefix = event[0];
      suffix = event[1];

    } else if (event[0] === "specialEvent") {

      prefix = event[1];
      suffix = false;

    } else {

      console.log("Invalid event: " + array[2]);
      return false;

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

    return false;

  }

  return { ...baseParameters, ...prefixParameters, ...suffixParameters, isValid: true };

}

export function parseCombatLogFlag(flagString) {
  // Step 1: Convert the hex string (e.g., "0x512") to a decimal integer
  const decimalFlag = parseInt(flagString, 16);

  // Step 2: Convert the decimal value to a binary string and pad to 16 bits
  const binaryString = decimalFlag.toString(2).padStart(16, '0');

  // Step 3: Extract specific parts of the flag using bitwise AND
  const affiliation = decimalFlag & 0xF;   // Last 4 bits
  const reaction = decimalFlag & 0xF0;    // Next 4 bits
  const control = decimalFlag & 0xF00;    // Third group of 4 bits
  const special = decimalFlag & 0xF000;   // Fourth group of 4 bits (special cases)

  // Step 4: Create an object to hold the parsed components
  const result = {};

  // Step 5: Map affiliation flags to descriptions
  if (affiliation === 0x1) result.affiliation = 'MINE';
  if (affiliation === 0x2) result.affiliation = 'PARTY';
  if (affiliation === 0x4) result.affiliation = 'RAID';
  if (affiliation === 0x8) result.affiliation = 'OUTSIDER';
  if (affiliation === 0xF) result.affiliation = 'MASK';

  // Step 6: Map reaction flags to descriptions
  if (reaction === 0x10) result.reaction = 'FRIENDLY';
  if (reaction === 0x20) result.reaction = 'NEUTRAL';
  if (reaction === 0x40) result.reaction = 'HOSTILE';
  if (reaction === 0xF0) result.reaction = 'MASK';

  // Step 7: Map control flags to descriptions
  if (control === 0x100) result.control = 'PLAYER';
  if (control === 0x200) result.control = 'NPC';
  if (control === 0x300) result.control = 'MASK';

  // Step 8: Map special flags to descriptions
  if (special & 0x1000) result.special = 'TARGET';
  if (special & 0x2000) result.special = 'FOCUS';
  if (special & 0x4000) result.special = 'MAINTANK';
  if (special & 0x8000) result.special = 'MAINASSIST';

  // Return the parsed result object
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

//SUPPORTIVE HELPER FUNCTIONS

export function tryStringToArray(string) {
  if (typeof string === "string") {

    const commaCount = (string.match(/,/g) || []).length;
    const doubleSpaceCount = (string.match(/  /g) || []).length;

    if (commaCount > 4 && doubleSpaceCount === 1) {

      let parts = string.split("  ");
      let part1 = parts[0].split(" ");
      let part2 = parts[1].split(",");
      return [...part1, ...part2].map(str => str.replace(/["\\\r]/g, ''));

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
export function findPrefixAndSuffix(event) {

  let check;

  if (typeof event === 'string') {
    check = event.split('_');
  } else {
    console.error('event is not a string:', event);
}
 

  if (check.length <= 1) {
    return false;
  } 

  for (let i = 0; i < check.length; i++) {

    let prefix = check.slice(0, i).join('');
    let suffix = check.slice(i, 5).join('');
    let specialEvent = check.join('');

    if (VALIDPREFIX.includes(prefix) && VALIDSUFFIX.includes(suffix)){
      return [prefix, suffix];

    } else if (SPECIALEVENTS.includes(specialEvent) && i === check.length - 1){
      return ["specialEvent", specialEvent];
    }
  }

  // If no valid prefix/suffix found, return empty array or handle it as needed
  return false;

}

export function returnBaseParameters (array){

  const buffStandard = array => {
    return {isBuff: array.includes("BUFF"),
            isDebuff: array.includes("DEBUFF"),
    }
  }

  const eventstandard = event => {

    return {isDamage: event.includes(["DAMAGE", "MISSED"]),
            isSpell: event.includes(["SPELL", "SPELLPERIODIC", "SPELLBUILDING"]),
            isMelee: event.includes("SWING"),
            isRange: event.includes("RANGE"),
            isDamage: event.includes("DAMAGE"),
            Missed: event.includes("MISS"),
            isHeal: event.includes("HEAL"),
            isEnergize: event.includes("ENERGIZE"),
            isDrain: event.includes("DRAIN"),
            isLeech: event.includes("LEECH"),
            isInterrupt: event.includes("INTERRUPT"),
            isDispel: event.includes("DISPEL"),
            isDispelFailed: event.includes("DISPELFAILED"),
            isStolen: event.includes("STOLEN"),
            isAuraAppliedDose: event.includes("AURAAPPLIEDDOSE"),
            isAuraRemovedDose: event.includes("AURAREMOVEDDOSE"),
            isAuraApplied: event.includes("AURAAPPLIED"),
            isAuraRemoved: event.includes("AURAREMOVED"),
            isAuraRefresh: event.includes("AURAREFRESH"),
            isAuraBroken: event.includes("AURABROKEN"),
            isAuraBrokenSpell: event.includes("AURABROKEN_SPELL"),
            isCastStart: event.includes("CASTSTART"),
            isCastSuccess: event.includes("CASTSUCCESS"),
            isCastFailed: event.includes("CASTFAILED"),
            isInstakill: event.includes("INSTAKILL"),
            isSummon: event.includes("SUMMON"),
            isCreate: event.includes("CREATE"),
            isResurrect: event.includes("RESURRECT"),
            idDamageShield: event.includes("DAMAGESHIELD"),
            idDamageShieldMissed: event.includes("DAMAGESHIELDMISSED"),
            isPartyKill: event.includes("PARTYKILL"),
            isUnitDied: event.includes("UNITDIED"),
            isUnitDestroyed: event.includes("UNITDESTROYED"),
            }
  }

  return {
    date: splitDate(array[0]),
    timeMs: timeStampMs(array[1]),
    ...eventstandard(array[2]),
    event: array[2],
    sourceGUID: array[3],
    sourceName: checkName(array[4]),
    sourceFlags: parseCombatLogFlag(array[5]),
    destGUID: array[6],
    destName: checkName(array[7]),
    destFlags: parseCombatLogFlag(array[8]),
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
    return false;
  }
  return name;
}

function checkAmount(amount){
  if (["nil", undefined].includes(amount)) {
    return 0;
  }
  return parseInt(amount, 10);
}