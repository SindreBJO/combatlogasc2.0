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
    const damageData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED"));
    const totalDamage = damageData.reduce((sum, obj) => {
      return sum + (getActualHit(obj.amount, obj.overkill) + (obj.absorbed || 0));
    }, 0);
    return totalDamage;
  }

  const getHealingTaken = () => {
    const damageData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = damageData.reduce((sum, obj) => sum + ((obj.amount || 0) - (obj.overhealing || 0)), 0);
    return totalHealing;
  }

  const getAbsorbed = () => {
    const absorbData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("DAMAGE"));
    const totalAbsorbed = absorbData.reduce((sum, obj) => sum + (obj.absorbed || 0), 0);
    return totalAbsorbed;
  }

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
    .filter(({ destFlag, event, absorbed }) =>
      destFlag === "player" &&
      event.includes("DAMAGE") &&
      !event.includes("MISSED") &&
      absorbed > 0
    )
    .map(({ timeStamp, absorbed }) => ({
      time: (timeStamp - sessionMetaData.startTime) / 1000,
      amount: absorbed || 0,
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
    totalDamage: 0,
    totalPhysicalDamage: 0,
    totalMagicalDamage: 0,

    normalAmount: 0,
    normalCount: 0,
    minNormal: null,
    maxNormal: null,
    avgNormal: 0,

    critAmount: 0,
    critCount: 0,
    minCrit: null,
    maxCrit: null,
    avgCrit: 0,

    glanceAmount: 0,
    glanceCount: 0,
    minGlance: null,
    maxGlance: null,
    avgGlance: 0,

    // NEW: Crushing blows
    crushAmount: 0,
    crushCount: 0,
    minCrush: null,
    maxCrush: null,
    avgCrush: 0,

    missCount: 0,
    dodgeCount: 0,
    parryCount: 0,
    resistCount: 0,
    absorbAmount: 0,

    blockCount: 0,
    blockFullCount: 0,
    blockPartialCount: 0,

    deflectCount: 0,
    immuneCount: 0,

    blockedTotal: 0,
    resistedTotal: 0,

    hitCount: 0,
    avg: 0,

    // REALISTIC HIT TABLE
    hitTable: {
      realHitCount: 0,
      results: {
        hit: 0,
        miss: 0,
        dodge: 0,
        parry: 0,
        resist: 0,
        immune: 0,
        blockFull: 0,
        blockPartial: 0,
        deflect: 0,
        absorb: 0,
        crush: 0,
        glance: 0,
        crit: 0,
        normal: 0,
      }
    }
  };

  const actual = (amt, over) => {
    const a = Number(amt) || 0;
    const o = Number(over) || 0;
    const result = o < a ? a - o : 0;
    return Math.max(result, 0);
  };

  filteredData.forEach(ev => {
    if (!ev) return;

    const evEvent = Array.isArray(ev.event)
      ? ev.event.map(x => x.toUpperCase())
      : [String(ev.event).toUpperCase()];

    const isDamage = evEvent.includes("DAMAGE");
    const isMissed = evEvent.includes("MISSED");
    const isSwing = evEvent.includes("SWING");

    if (!isDamage && !isMissed) return;

    // ============================
    // SPELL IDENTIFICATION
    // ============================
    let spellName, spellId, spellSchool;

    if (isSwing) {
      spellName = "Attack";
      spellId = 0;
      spellSchool = "Physical";
    } else {
      spellName =
        ev.spellName ||
        ev.spell ||
        ev.ability ||
        ev.abilityName ||
        `unknown-${ev.spellId || ev.abilityId || "none"}`;

      spellId = ev.spellId || ev.abilityId || 0;
      spellSchool = ev.school || ev.spellSchool || "Unknown";
    }

    const category = spellSchool === "Physical" ? "Physical" : "Magical";
    const spellKey = `${spellName}::${spellId}`;

    // ============================
    // CREATE SPELL ENTRY IF NEEDED
    // ============================
    if (!spells[spellKey]) {
      spells[spellKey] = {
        name: spellName,
        id: spellId,
        school: spellSchool,
        category,

        physicalDamage: 0,
        magicalDamage: 0,

        totalDamage: 0,

        normalAmount: 0,
        normalCount: 0,
        minNormal: null,
        maxNormal: null,

        critAmount: 0,
        critCount: 0,
        minCrit: null,
        maxCrit: null,

        glanceAmount: 0,
        glanceCount: 0,
        minGlance: null,
        maxGlance: null,

        crushAmount: 0,
        crushCount: 0,
        minCrush: null,
        maxCrush: null,

        missCount: 0,
        dodgeCount: 0,
        parryCount: 0,
        resistCount: 0,
        absorbAmount: 0,

        blockCount: 0,
        blockFullCount: 0,
        blockPartialCount: 0,

        deflectCount: 0,
        immuneCount: 0,

        blockedTotal: 0,
        resistedTotal: 0,

        hitCount: 0,
        avg: 0,
      };
    }

    const s = spells[spellKey];

    // ============================
    // MISS EVENTS
    // ============================
    if (isMissed) {
      const missType = (ev.missType || "").toUpperCase();

      s.missCount++;
      totals.missCount++;

      if (missType.includes("DODGE")) {
        s.dodgeCount++; totals.dodgeCount++;
        totals.hitTable.results.dodge++;
        totals.hitTable.realHitCount++;
      }
      else if (missType.includes("PARRY")) {
        s.parryCount++; totals.parryCount++;
        totals.hitTable.results.parry++;
        totals.hitTable.realHitCount++;
      }
      else if (missType.includes("RESIST")) {
        s.resistCount++; totals.resistCount++;
        totals.hitTable.results.resist++;
        totals.hitTable.realHitCount++;
      }
      else if (missType.includes("BLOCK")) {
        // FULL BLOCK (WotLK: full block appears ONLY here)
        s.blockCount++;
        s.blockFullCount++;
        totals.blockCount++;
        totals.blockFullCount++;

        totals.hitTable.results.blockFull++;
        totals.hitTable.realHitCount++;
      }
      else if (missType.includes("DEFLECT")) {
        s.deflectCount++; totals.deflectCount++;
        totals.hitTable.results.deflect++;
        totals.hitTable.realHitCount++;
      }
      else if (missType.includes("IMMUNE")) {
        s.immuneCount++; totals.immuneCount++;
        totals.hitTable.results.immune++;
        totals.hitTable.realHitCount++;
      }
      else {
        totals.hitTable.results.miss++;
        totals.hitTable.realHitCount++;
      }

      return;
    }

    // ============================
    // DAMAGE EVENT (WotLK: partial block, absorb, immune, crush, glance here)
    // ============================
    const dmg = actual(ev.amount, ev.overkill);
    const blocked = Number(ev.blocked || 0);
    const absorbed = Number(ev.absorbed || 0);
    const resisted = Number(ev.resisted || 0);

    const isCrit =
      ev.critical === true ||
      ev.crit === true ||
      evEvent.includes("CRITICAL") ||
      evEvent.includes("_CRIT");

    const isGlance = ev.glancing === true;
    const isCrush = ev.crushing === true || ev.isCrushing === true;
    const isImmuneDamageEvent =
      (evEvent.includes("IMMUNE") ||
      ev.immune === true ||
      (dmg === 0 && absorbed === 0 && resisted === 0 && blocked === 0));

    // IMMUNE inside DAMAGE event (WotLK behavior)
    if (isImmuneDamageEvent) {
      s.immuneCount++;
      totals.immuneCount++;

      totals.hitTable.results.immune++;
      totals.hitTable.realHitCount++;
      return;
    }

    // Damage accumulation
    s.totalDamage += dmg;
    totals.totalDamage += dmg;

    if (category === "Physical") {
      s.physicalDamage += dmg;
      totals.totalPhysicalDamage += dmg;
    } else {
      s.magicalDamage += dmg;
      totals.totalMagicalDamage += dmg;
    }

    // Shared reductions
    s.blockedTotal += blocked;
    totals.blockedTotal += blocked;

    s.absorbAmount += absorbed;
    totals.absorbAmount += absorbed;

    s.resistedTotal += resisted;
    totals.resistedTotal += resisted;

    // ABSORB (not a hit)
    if (absorbed > 0 && dmg === 0) {
      totals.hitTable.results.absorb++;
      return;
    }

    // BLOCK LOGIC
    if (blocked > 0) {
      s.blockCount++;
      totals.blockCount++;

      if (dmg === 0) {
        // FULL BLOCK — but DAMAGE events should not give full block in WotLK
        s.blockFullCount++;
        totals.blockFullCount++;

        totals.hitTable.results.blockFull++;
        totals.hitTable.realHitCount++;
        return;
      } else {
        // PARTIAL BLOCK
        s.blockPartialCount++;
        totals.blockPartialCount++;

        totals.hitTable.results.blockPartial++;
      }
    }

    // ============================
    // GLANCING BLOW
    // ============================
    if (isGlance) {
      s.glanceCount++;
      totals.glanceCount++;

      s.glanceAmount += dmg;
      totals.glanceAmount += dmg;

      totals.hitTable.results.glance++;
      totals.hitTable.results.hit++;
      totals.hitTable.realHitCount++;

      // min/max
      s.minGlance = s.minGlance === null ? dmg : Math.min(s.minGlance, dmg);
      s.maxGlance = s.maxGlance === null ? dmg : Math.max(s.maxGlance, dmg);

      totals.minGlance = totals.minGlance === null ? dmg : Math.min(totals.minGlance, dmg);
      totals.maxGlance = totals.maxGlance === null ? dmg : Math.max(totals.maxGlance, dmg);

      s.hitCount++; totals.hitCount++;
      return;
    }

    // ============================
    // CRUSHING BLOW
    // ============================
    if (isCrush) {
      s.crushCount++;
      totals.crushCount++;

      s.crushAmount += dmg;
      totals.crushAmount += dmg;

      totals.hitTable.results.crush++;
      totals.hitTable.results.hit++;
      totals.hitTable.realHitCount++;

      s.minCrush = s.minCrush === null ? dmg : Math.min(s.minCrush, dmg);
      s.maxCrush = s.maxCrush === null ? dmg : Math.max(s.maxCrush, dmg);

      totals.minCrush = totals.minCrush === null ? dmg : Math.min(totals.minCrush, dmg);
      totals.maxCrush = totals.maxCrush === null ? dmg : Math.max(totals.maxCrush, dmg);

      s.hitCount++; totals.hitCount++;
      return;
    }

    // ============================
    // CRITICAL HIT
    // ============================
    if (isCrit) {
      s.critCount++;
      totals.critCount++;

      s.critAmount += dmg;
      totals.critAmount += dmg;

      totals.hitTable.results.crit++;
      totals.hitTable.results.hit++;
      totals.hitTable.realHitCount++;

      s.minCrit = s.minCrit === null ? dmg : Math.min(s.minCrit, dmg);
      s.maxCrit = s.maxCrit === null ? dmg : Math.max(s.maxCrit, dmg);

      totals.minCrit = totals.minCrit === null ? dmg : Math.min(totals.minCrit, dmg);
      totals.maxCrit = totals.maxCrit === null ? dmg : Math.max(totals.maxCrit, dmg);

      s.hitCount++; totals.hitCount++;
      return;
    }

    // ============================
    // NORMAL HIT
    // ============================
    s.normalCount++;
    totals.normalCount++;

    s.normalAmount += dmg;
    totals.normalAmount += dmg;

    totals.hitTable.results.normal++;
    totals.hitTable.results.hit++;
    totals.hitTable.realHitCount++;

    s.minNormal = s.minNormal === null ? dmg : Math.min(s.minNormal, dmg);
    s.maxNormal = s.maxNormal === null ? dmg : Math.max(s.maxNormal, dmg);

    totals.minNormal = totals.minNormal === null ? dmg : Math.min(totals.minNormal, dmg);
    totals.maxNormal = totals.maxNormal === null ? dmg : Math.max(totals.maxNormal, dmg);

    s.hitCount++;
    totals.hitCount++;
  });

  // ============================
  // AVERAGES
  // ============================
  Object.values(spells).forEach(sp => {
    const totalHits = sp.normalCount + sp.critCount + sp.glanceCount + sp.crushCount;

    sp.avg = totalHits > 0 ? +(sp.totalDamage / totalHits).toFixed(2) : 0;
    sp.avgNormal = sp.normalCount > 0 ? +(sp.normalAmount / sp.normalCount).toFixed(2) : 0;
    sp.avgCrit = sp.critCount > 0 ? +(sp.critAmount / sp.critCount).toFixed(2) : 0;
    sp.avgGlance = sp.glanceCount > 0 ? +(sp.glanceAmount / sp.glanceCount).toFixed(2) : 0;
    sp.avgCrush = sp.crushCount > 0 ? +(sp.crushAmount / sp.crushCount).toFixed(2) : 0;
  });

  totals.avg = totals.hitCount > 0 ? +(totals.totalDamage / totals.hitCount).toFixed(2) : 0;

  totals.avgNormal =
    totals.normalCount > 0 ? +(totals.normalAmount / totals.normalCount).toFixed(2) : 0;

  totals.avgCrit =
    totals.critCount > 0 ? +(totals.critAmount / totals.critCount).toFixed(2) : 0;

  totals.avgGlance =
    totals.glanceCount > 0 ? +(totals.glanceAmount / totals.glanceCount).toFixed(2) : 0;

  totals.avgCrush =
    totals.crushCount > 0 ? +(totals.crushAmount / totals.crushCount).toFixed(2) : 0;

  console.log("DamageDoneUIBreakDown:", { spells, totals });
  return { spells, totals };
};
















































