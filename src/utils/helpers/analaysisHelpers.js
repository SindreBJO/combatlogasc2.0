import { BOSSNAMES } from "./constants";
import { MultipleNameEnemyNPCs } from "./constants";

function getBins(totalSeconds, binSize = 1) {
  const bins = [];
  const fullBins = Math.floor(totalSeconds / binSize);
  const remainder = totalSeconds % binSize;

  for (let i = 0; i < fullBins; i++) {
    bins.push(binSize);
  }

  if (remainder > 0) {
    bins.push(remainder);
  }

  return bins;
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

export function getEntityTableData(entityObj, sessionData, sessionMetaData) {
  if (!sessionData || !entityObj) return null;

  // Normalize identity fields so callers can rely on:
  // - identity.ids : array of ids (may be empty)
  // - identity.id  : primary id (first id or fallback)
  // - identity.name: primary display name (string)
  const normalizedIds = Array.isArray(entityObj.ids)
    ? entityObj.ids.slice()
    : entityObj.ids
    ? [entityObj.ids]
    : entityObj.id
    ? [entityObj.id]
    : [];
  const primaryId = normalizedIds[0] ?? entityObj.id ?? "Error";
  const displayName =
    entityObj.name ||
    (Array.isArray(entityObj.names) ? entityObj.names[0] : entityObj.names) ||
    "Error";

  const entityDealtData = sessionData.filter(obj => (
    (entityObj.processType === "byName" &&
      entityObj.name === obj.sourceName &&
      entityObj.entityType === obj.sourceFlag) ||
    (entityObj.processType === "byId" && obj.sourceGUID === entityObj.id)
  ));
  
  const entityReceivedData = sessionData.filter(obj => (
    (entityObj.processType === "byName" &&
      entityObj.name === obj.destName &&
      entityObj.entityType === obj.destFlag) ||
    (entityObj.processType === "byId" && obj.destGUID === entityObj.id)
  ));

const timeInterval = 5000; // 5 seconds

function getDamageGraphPoints() {
  // Filter valid events and sort by timestamp
  const damageEvents = entityDealtData
    .filter(obj => obj.event.includes("DAMAGE") && !obj.event.includes("MISSED"))
    .sort((a, b) => a.timeStamp - b.timeStamp);

  const graphPoints = [];

  const start = sessionMetaData.startTime;
  const end = sessionMetaData.endTime;

  let eventIndex = 0;

  // Loop through every 5-second bin from start → end
  for (let binStart = start; binStart <= end; binStart += timeInterval) {
    const binEnd = binStart + timeInterval;
    let sumAmount = 0;

    // Add up all damage events within this 5 s window
    while (
      eventIndex < damageEvents.length &&
      damageEvents[eventIndex].timeStamp < binEnd
    ) {
      const e = damageEvents[eventIndex];
      const dmg = getActualHit(e.amount, e.overkill);
      sumAmount += dmg;
      eventIndex++;
    }

    // Always push a bin — even if sumAmount is 0
    graphPoints.push({
      time: binStart,
      totalDamage: sumAmount
    });
  }

  return graphPoints;
}

  const getDPS = () => {
    const damageData = entityDealtData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED") && obj.spellName !== "Stagger");
    const totalDamage = damageData.reduce((sum, obj) => sum + getActualHit(obj.amount, obj.overkill), 0);
    const denom = sessionMetaData?.encounterLengthSec || 1;
    return (totalDamage / denom).toFixed(0);
  }

  const getDamageDone = () => {
    const damageData = entityDealtData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED") && obj.spellName !== "Stagger");
    const totalDamage = damageData.reduce((sum, obj) => sum + getActualHit(obj.amount, obj.overkill), 0);
    return totalDamage.toFixed(0);
  }

  const getDamageTaken = () => {
  // We care about DAMAGE events, and MISSED events specifically with ABSORB
  const damageData = entityReceivedData.filter(obj =>
    obj.event &&
    (
      obj.event.includes("DAMAGE") || 
      (obj.event.includes("MISSED") && obj.missType === "ABSORB")
    )
  );

  const totalDamage = damageData.reduce((sum, obj) => {
    const actual = getActualHit(obj.amount, obj.overkill) || 0;

    // DAMAGE events with partial/full absorb
    const partialAbsorb = obj.absorbed || 0;

    // MISSED ABSORB events (full absorb only)
    const fullAbsorb = (obj.missType === "ABSORB" ? (obj.amount || 0) : 0);

    // total absorbed from either type
    const absorbed = partialAbsorb + fullAbsorb;

    // YOU requested: absorbed counts as taken
    return sum + actual + absorbed;
  }, 0);

  return totalDamage;
};

  const getHealingTaken = () => {
    const damageData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = damageData.reduce((sum, obj) => sum + ((obj.amount || 0) - (obj.overhealing || 0)), 0);
    return totalHealing;
  }

const getAbsorbed = () => {
  const absorbData = entityReceivedData.filter(obj =>
    obj?.event &&
    (obj.event.includes("DAMAGE") || obj.event.includes("MISSED"))
  );

  let totalAbsorbed = 0;

  for (const obj of absorbData) {
    const isDamageEvent = obj.event.includes("DAMAGE");
    const isMissedEvent = obj.event.includes("MISSED");

    // --- Case 1: Partial absorbs on DAMAGE events ---
    if (isDamageEvent && typeof obj.absorbed === "number" && obj.absorbed > 0) {
      totalAbsorbed += obj.absorbed;

      if (obj.absorbed > 10000) {
        console.log("Large absorb detected:", obj);
      }

      continue;
    }

    // --- Case 2: Full absorbs on MISSED events (SPELL_MISSED / SWING_MISSED) ---
    if (isMissedEvent && obj.missType === "ABSORB" && typeof obj.amount === "number" && obj.amount > 0) {
      totalAbsorbed += obj.amount;

      if (obj.amount > 100000) {
        console.log("Large full absorb detected:", obj);
      }

      continue;
    }
  }

  return totalAbsorbed;
};

  const getHealingDone = () => {
    const healingData = entityDealtData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = healingData.reduce((sum, obj) => sum + ((obj.amount || 0) - (obj.overhealing || 0)), 0);
    return totalHealing;
  }

  const getHps = () => {
    const healingData = entityDealtData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = healingData.reduce((sum, obj) => sum + ((obj.amount || 0) - (obj.overhealing || 0)), 0);
    const denom = sessionMetaData?.encounterLengthSec || 1;
    return (totalHealing / denom).toFixed(0);
  }
  const getInterrupts = () => {
    // Placeholder: return 0 for now to avoid undefined values.
    // Implement detailed parsing if needed later.
    return 0;
  }
  const playerCheck = entityObj.entityType === "player" || entityObj.entityType === "pet";
  const graphPoints = playerCheck ? getDamageGraphPoints() : [];

    const tableData = {
      identity: {
        name: displayName,
        id: primaryId,
        ids: normalizedIds,
        processType: entityObj.processType || "Error",
        entityType: entityObj.entityType || "Error",
      },

    combatStats: {
        dps: getDPS(),
        hps: getHps(),
        totalDamage: getDamageDone(),
        totalHealingDone: getHealingDone(),
        totalAbsorbedTaken: getAbsorbed(),
        damageTaken: getDamageTaken(),
        healingTaken: getHealingTaken(),
      },

    utility: {
        interrupts: getInterrupts() || 0,
        dispels: entityObj.dispels ?? 0,
        purges: entityObj.purges ?? 0,
        cleanses: entityObj.cleanses ?? 0,
        ress: entityObj.ress ?? 0,
        ccBreaks: entityObj.ccBreaks ?? 0,
      },

    meta: {
        aliveStatus: entityObj.alive,
        ressurectedStatus: Array.isArray(entityObj.ressurectedAt) ? entityObj.ressurectedAt.length > 0 : Boolean(entityObj.ressurectedAt),
        damageGraphData: graphPoints,
      },
  };

  return tableData;

}

export function getRaidDamageGraphPoints(sessionData, sessionMetaData, inputInterval) {
  if (inputInterval){}
  else if (sessionMetaData.encounterLengthMs <= 1000) {return [[], []];}
  else if (sessionMetaData.encounterLengthMs <= 10000) {inputInterval = sessionMetaData.encounterLengthMs / 30;}
  else if (sessionMetaData.encounterLengthMs <= 60000) {inputInterval = sessionMetaData.encounterLengthMs / 50;}
  else if (sessionMetaData.encounterLengthMs <= 100000) {inputInterval = sessionMetaData.encounterLengthMs / 75;}
  else {inputInterval = sessionMetaData.encounterLengthMs / 100;}
  if (!sessionMetaData?.entitiesData?.players || !sessionMetaData?.entitiesData?.pets) {
    console.warn("getRaidDamageGraphPoints: Missing or invalid player metadata");
    return [[], []];
  }

  const entities = [...sessionMetaData.entitiesData.players, ...sessionMetaData.entitiesData.pets];

  // 🔹 Helper to check multi-name boss groups
  const isMultiNameBossHit = (bossName, destName) => {
    if (!bossName || !destName) return false;
    const group = MultipleNameEnemyNPCs.find(names => names.includes(bossName));
    if (!group) return false;
    return group.some(name => destName.includes(name));
  };

  // Filter player damage events
  const entityDealtData = sessionData.filter(({ sourceName, sourceFlag, event, spellName }) => {
    if (sourceFlag !== "player") return false;
    if (!event.includes("DAMAGE") || event.includes("MISSED")) return false;
    return entities.some(({ name }) => name === sourceName);
  });

  // Simplify for graph use
  const graphAllDamagePointsData = entityDealtData.map(
    ({ timeStamp, amount, overkill = 0, destName }) => ({
      timeStamp: timeStamp - sessionMetaData.startTime,
      amount: getActualHit(amount, overkill),
      destName,
    })
  );

  const start = 0;
  const end = sessionMetaData.endTime - sessionMetaData.startTime;

  const graphAllDamagePoints = [{ time: 0, amount: 0 }];
  const graphBossDamagePoints = [{ time: 0, amount: 0 }];

  let eventIndex = 0;

  for (let binStart = start; binStart < end; binStart += inputInterval) {
    const binEnd = Math.min(binStart + inputInterval, end);
    const actualDuration = (binEnd - binStart) / 1000;

    let sumAmount = 0;
    let bossSumAmount = 0;

    while (
      eventIndex < graphAllDamagePointsData.length &&
      graphAllDamagePointsData[eventIndex].timeStamp < binEnd
    ) {
      const e = graphAllDamagePointsData[eventIndex];
      const dmg = e.amount || 0;

      // 🔹 Boss match check
      const bossName = sessionMetaData.bossName;
      const isBossTarget =
        e.destName === bossName || isMultiNameBossHit(bossName, e.destName);

      if (isBossTarget) bossSumAmount += dmg;
      else sumAmount += dmg;

      eventIndex++;
    }

    graphAllDamagePoints.push({
      time: binEnd / 1000,
      amount: sumAmount / actualDuration,
    });

    graphBossDamagePoints.push({
      time: binEnd / 1000,
      amount: bossSumAmount / actualDuration,
    });
  }
  console.log("Raid Damage Graph Points:", graphAllDamagePoints, graphBossDamagePoints);
  return [graphAllDamagePoints, graphBossDamagePoints];
}


export function getRaidDamageTakenGraphPoints(sessionData, sessionMetaData, binGoal) {
  if (binGoal){}
  else { binGoal = Math.min(sessionMetaData.encounterLengthMs / 100, 100); }
  if (!sessionMetaData?.entitiesData?.players) {
    console.warn("getRaidDamageGraphPoints: Missing or invalid player metadata");
    return [];
  }

  const encounterLengthMs = sessionMetaData.endTime - sessionMetaData.startTime || 0;

  // 🧮 Compute number of bins and bin size (equal length)
  const binsIfOneSecond = encounterLengthMs / 1000;
  const numBins = Math.min(Math.ceil(binsIfOneSecond), binGoal);
  const inputInterval = encounterLengthMs / numBins; // ms per bin

  // --- Build datasets ---
  const entityHealingTakenData = sessionData
    .filter(({ destFlag, event }) =>
      destFlag === "player" && event.includes("HEAL")
    )
    .map(({ timeStamp, amount, overhealing }) => ({
      time: (timeStamp - sessionMetaData.startTime) / 1000,
      amount: Math.max(0, (amount || 0) - (overhealing || 0)),
    }));

  const entityAbsorbedTakenData = sessionData
  .filter(({ destFlag, event, missType, absorbed}) =>
    destFlag === "player" &&
    (
      // Case 1: DAMAGE event that had partial or full absorb
      (event.includes("DAMAGE") && absorbed > 0)
      ||
      // Case 2: MISSED event with ABSORB = full absorb
      (event.includes("MISSED") && missType === "ABSORB")
    )
  )
  .map(({ timeStamp, absorbed, amount, missType }) => ({
    time: (timeStamp - sessionMetaData.startTime) / 1000,
    // For DAMAGE: absorbed field holds absorbed amount
    // For MISSED ABSORB: amount field holds the full absorbed value
    amount: missType === "ABSORB" ? amount : absorbed,
  }));

  const entityDamageTakenData = sessionData
    .filter(({ destFlag, event }) =>
      destFlag === "player" &&
      event.includes("DAMAGE") &&
      !event.includes("MISSED")
    )
    .map(({ timeStamp, amount, overkill }) => ({
      time: (timeStamp - sessionMetaData.startTime) / 1000,
      amount: getActualHit(amount, overkill),
    }));

  // --- Time binning ---
  const graphDamageTakenHealedPoints = [{ time: 0, amount: 0 }];
  const graphAbsorbTakenPoints = [{ time: 0, amount: 0 }];
  const graphSumDamageNotHealedPoints = [{ time: 0, amount: 0 }];

  let healIndex = 0;
  let absorbIndex = 0;
  let dmgIndex = 0;
  let healthNotHealedSum = 0;

  const realStartToCustomStart = (sessionMetaData.startTime - sessionMetaData.realEncounterStartTime) / 1000;
  const beforeCustomIntervalBins = getBins(realStartToCustomStart, inputInterval / 1000);
  console.log("realStartToCustomStart:", realStartToCustomStart);
  const binDurationSec = inputInterval / 1000; // constant for every bin

  
  for (let i = 0; i < numBins; i++) {

  }


  for (let i = 0; i < numBins; i++) {
    const binStart = i * binDurationSec;
    const binEnd = (i + 1) * binDurationSec;

    let healingSum = 0;
    let absorbSum = 0;
    let damageSum = 0;

    while (healIndex < entityHealingTakenData.length && entityHealingTakenData[healIndex].time < binEnd) {
      healingSum += entityHealingTakenData[healIndex].amount;
      healIndex++;
    }

    while (absorbIndex < entityAbsorbedTakenData.length && entityAbsorbedTakenData[absorbIndex].time < binEnd) {
      absorbSum += entityAbsorbedTakenData[absorbIndex].amount;
      absorbIndex++;
    }

    while (dmgIndex < entityDamageTakenData.length && entityDamageTakenData[dmgIndex].time < binEnd) {
      damageSum += entityDamageTakenData[dmgIndex].amount;
      dmgIndex++;
    }
    if (healthNotHealedSum < 0) healthNotHealedSum = 0;
    healthNotHealedSum += damageSum - healingSum;

    graphDamageTakenHealedPoints.push({
      time: binEnd,
      amount: healingSum / binDurationSec,
    });

    graphAbsorbTakenPoints.push({
      time: binEnd,
      amount: absorbSum / binDurationSec,
    });

    graphSumDamageNotHealedPoints.push({
      time: binEnd,
      amount: healthNotHealedSum < 0 ? 0 : healthNotHealedSum,
    });
  }

  return [graphSumDamageNotHealedPoints, graphDamageTakenHealedPoints, graphAbsorbTakenPoints];
}




export const getDamageDoneUIBreakDown = (filteredData) => {
  if (!filteredData || filteredData.length === 0) return null;

  const spells = {};

  const totals = {
    //Totals
    totalDamage: 0,

    //Normals
    normalAmount: 0,
    normalCount: 0,
    minNormal: null,
    maxNormal: null,

    //Criticals
    critAmount: 0,
    critCount: 0,
    minCrit: null,
    maxCrit: null,

    avoidedCount: 0,
    hitCount: 0,
  };

  const actual = (amt, over) => {
    const a = Number(amt) || 0;
    const o = Number(over) || 0;
    return Math.max(a - o, 0);
  };

  filteredData.forEach(parse => {
    if (!parse) return;

    //Algorithm Entry Checks
    const damage = parse.event.some(x => x.includes("DAMAGE")) || false;
    const missed = parse.event.some(x => x.includes("MISSED")) || false;
    if (!damage && !missed) return;
    const autoAttack = parse.event.some(x => x.includes("SWING")) || false;
    const crushingAttack = parse.crushing ? true : false;
    const glancingBlow = parse.glancing ? true : false;
    const critical = parse.critical ? true : false;
    const missType = parse.missType || false;
    const fullAbsorb = parse.missType === "ABSORB" ? true : false;
    const block = Number(parse.blocked || 0) > 0 ? true : false;
    const fullBlock = (parse.amount === 0 && block) ? true : false;
    const fullResist = (parse.amount === 0 && parse.resisted > 0) ? true : false;


    // Track every event
    totals.hitCount++;

    // SPELL IDENTIFICATION
    let spellName = parse.spellName || "";
    let spellId = parse.spellId || "";
    let spellSchool = parse.spellSchool || "";
    let category = spellSchool === "Physical" ? "Physical" : "Magical";

    if (crushingAttack) {
      spellName = "Crushing Blow";
      spellId = -2;
      spellSchool = "Physical";
    } else if (autoAttack) {
      spellName = "Attack";
      spellId = -1;
      spellSchool = "Physical";
    } else {
      spellName =
        parse.spellName || "error_unknown_spellName";
        spellId = parse.spellId || "error_unknown_spellId";
        spellSchool = parse.spellSchool || "error_unknown_spellSchool";
    }
    const spellKey = `${spellName}:${spellId}`;

    if (!spells[spellKey]) {
      spells[spellKey] = {
        name: spellName,
        id: spellId,
        school: spellSchool,
        category,

            //Totals
        totalDamage: 0,
          
        //Normals
        normalAmount: 0,
        normalCount: 0,
        minNormal: null,
        maxNormal: null,
          
        //Criticals
        critAmount: 0,
        critCount: 0,
        minCrit: null,
        maxCrit: null,
          
        avoidedCount: 0,
        hitCount: 0,
      };
    }

    const selectedSpell = spells[spellKey];

    selectedSpell.hitCount++;

    // ============================
    // AVOIDED EVENTS
    // ============================
    if (missed) {
      const missType = (parse.missType || "");

      switch (missType) {
        case "MISS": totals.missCount++; selectedSpell.missCount++; break;
        case "DODGE": totals.dodgeCount++; selectedSpell.dodgeCount++; break;
        case "PARRY": totals.parryCount++; selectedSpell.parryCount++; break;
        case "DEFLECT": totals.deflectCount++; selectedSpell.deflectCount++; break;
        case "IMMUNE": totals.immuneCount++; selectedSpell.immuneCount++; break;
        case "RESIST": totals.resistCount++; selectedSpell.resistCount++; break;
        case "EVADE": totals.evadeCount++; selectedSpell.evadeCount++; break;
        case "ABSORB": 
          totals.absorbCount++; 
          selectedSpell.absorbCount++; 
          totals.absorbAmount += parse.amount;
          break;
        case "BLOCK":
          totals.blockCount++; 
          selectedSpell.blockCount++;
          totals.blockFullCount++; 
          selectedSpell.blockFullCount++;
          break;
        default:
          console.log("Unknown miss type encountered in damage analysis:", missType);
          break;
      }

      totals.avoidedCount++;
      selectedSpell.avoidedCount++;
      return;

    } else if (damage){
    // ============================
    // DAMAGE EVENTS
    // ============================

    const dmg = actual(parse.amount, parse.overkill);

    const blocked = Number(parse.blocked || 0);
    const absorbed = Number(parse.absorbed || 0);
    const resisted = Number(parse.resisted || 0);
    let checkCount = 0;

    // ===== FULL ZERO-DAMAGE CASES (avoided except full absorb) =====

    // FULL RESIST
    if (dmg === 0 && resisted > 0) {
      totals.resistCount++; selectedSpell.resistCount++;
      totals.resistedTotal += resisted; selectedSpell.resistedTotal += resisted;
      totals.avoidedCount++;
      checkCount++;
      return;
    }
    if (blocked > 0 && dmg === 0) {
      totals.blockCount++; selectedSpell.blockCount++;
      totals.blockFullCount++; selectedSpell.blockFullCount++;
      totals.blockedTotal += blocked; selectedSpell.blockedTotal += blocked;
      totals.avoidedCount++;
      checkCount++;
      return;
    }

    // FULL ABSORB (0 dmg) => YOUR RULE: HIT
    if (dmg === 0 && absorbed > 0) {
      totals.absorbAmount += absorbed; selectedSpell.absorbAmount += absorbed;
      totals.hitCount++; selectedSpell.hitCount++;
      checkCount++;
      return;
    }

    // ===== PARTIAL REDUCTIONS =====

    if (absorbed > 0 && dmg > 0) {
      totals.absorbAmount += absorbed; selectedSpell.absorbAmount += absorbed;
    }

    if (blocked > 0 && dmg > 0) {
      totals.blockCount++; selectedSpell.blockCount++;
      totals.blockPartialCount++; selectedSpell.blockPartialCount++;
      totals.blockedTotal += blocked; selectedSpell.blockedTotal += blocked;
    }

    if (resisted > 0 && dmg > 0) {
      totals.resistedTotal += resisted; selectedSpell.resistedTotal += resisted;
    }

    // ===== APPLY DAMAGE HIT =====
    totals.totalDamage += dmg; selectedSpell.totalDamage += dmg;

    if (category === "Physical") {
      totals.totalPhysicalDamage += dmg; selectedSpell.physicalDamage += dmg;
    } else {
      totals.totalMagicalDamage += dmg; selectedSpell.magicalDamage += dmg;
    }

    totals.hitCount++; selectedSpell.hitCount++;

    // CRIT
    if (critical) {
      totals.critCount++; selectedSpell.critCount++;
      totals.critAmount += dmg; selectedSpell.critAmount += dmg;

      selectedSpell.minCrit = selectedSpell.minCrit === null ? dmg : Math.min(selectedSpell.minCrit, dmg);
      selectedSpell.maxCrit = Math.max(selectedSpell.maxCrit, dmg);

      totals.minCrit = totals.minCrit === null ? dmg : Math.min(totals.minCrit, dmg);
      totals.maxCrit = Math.max(totals.maxCrit, dmg);
      return;
    }

    // GLANCE
    if (glancingBlow) {
      totals.glanceCount++; selectedSpell.glanceCount++;
      totals.glanceAmount += dmg; selectedSpell.glanceAmount += dmg;
      return;
    }

    // NORMAL HIT
    totals.normalCount++; selectedSpell.normalCount++;
    totals.normalAmount += dmg; selectedSpell.normalAmount += dmg;

    selectedSpell.minNormal = selectedSpell.minNormal === null ? dmg : Math.min(selectedSpell.minNormal, dmg);
    selectedSpell.maxNormal = Math.max(selectedSpell.maxNormal, dmg);

    totals.minNormal = totals.minNormal === null ? dmg : Math.min(totals.minNormal, dmg);
    totals.maxNormal = Math.max(totals.maxNormal, dmg);

    if (checkCount > 1){ console.warn("Multiple return conditions met in damage analysis for parse:", parse)};
  } else {
    console.log("Unknown event type encountered in damage analysis:", parse);
  }


  });

  return { spells, totals };
};
