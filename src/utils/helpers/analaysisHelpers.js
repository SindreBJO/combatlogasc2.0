// --- Primary Entity Table Data Builder ---
export function getEntityTableData(entityObj, sessionData, sessionMetaData) {
  if (!sessionData || !entityObj) return null;

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
      const dmg = (e.amount || 0) - (e.overkill || 0);
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


  const overKillList = [];
  const buffList = [];

  entityReceivedData.forEach((obj) => {
    if (obj.overkill && obj.overkill > obj.amount) {
      overKillList.push(obj);
    }
  });
  entityReceivedData.forEach((obj) => {
    if (obj.spellName === "Ardent defender") {
      buffList.push(obj);
    }
  });

  const getDPS = () => {
    const damageData = entityDealtData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED"));
    const totalDamage = damageData.reduce((sum, obj) => sum + (obj.amount - obj.overkill || 0), 0);
    return (totalDamage / sessionMetaData.encounterLengthSec).toFixed(0);
  }

  const getDamageDone = () => {
    const damageData = entityDealtData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED"));
    const totalDamage = damageData.reduce((sum, obj) => sum + (obj.amount - obj.overkill || 0), 0);
    return totalDamage
    .toFixed(0) // one decimal place
  }

  const getDamageTaken = () => {
    const damageData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("DAMAGE") && !obj.event.includes("MISSED"));
    const totalDamage = damageData.reduce((sum, obj) => {
      const overkill = Math.min(obj.overkill || 0, obj.amount || 0);
      const absorbed = obj.absorbed || 0;
      const amount = obj.amount || 0;
      return sum + (amount + absorbed);
    }, 0);
    return totalDamage
  }

  const getHealingTaken = () => {
    const damageData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = damageData.reduce((sum, obj) => sum + (obj.amount - obj.overhealing || 0), 0);
    return totalHealing
  }

  const getAbsorbed = () => {
    const absorbData = entityReceivedData.filter((obj) => obj.event && obj.event.includes("DAMAGE"));
    const totalAbsorbed = absorbData.reduce((sum, obj) => sum + (obj.absorbed || 0), 0);
    return totalAbsorbed
  }

  const getHealingDone = () => {
    const healingData = entityDealtData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = healingData.reduce((sum, obj) => sum + (obj.amount - obj.overhealing || 0), 0);
    return totalHealing
  }

  const getHps = () => {
    const healingData = entityDealtData.filter((obj) => obj.event && obj.event.includes("HEAL"));
    const totalHealing = healingData.reduce((sum, obj) => sum + (obj.amount - obj.overhealing || 0), 0);
    return (totalHealing / sessionMetaData.encounterLengthSec)
    .toFixed(0);
  }
  const getInterrupts = () => {
    let interruptcastData;
    let interruptSuccessData;
    let returnArray = entityDealtData.filter(
      (obj) =>
        obj.event &&
        (( obj.event.includes("INTERRUPT") || obj.event.includes("SPELL") && obj.event.includes("CAST")))
    );
  }

    const tableData = {
      identity: {
        name: entityObj.name || entityObj.names || "Error", //Done
        id: entityObj.id || entityObj.id || "Error", //Done
        processType: entityObj.processType || "Error", //Done
        entityType: entityObj.entityType || "Error", //Done
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
        ress: entityObj.ress ?? 0, // resurrections if applicable
        ccBreaks: entityObj.ccBreaks ?? 0,
      },

    meta: {
        aliveStatus: entityObj.alive , //Done
        ressurectedStatus: entityObj.ressurectedAt.length > 0 , //Done
        damageGraphData: getDamageGraphPoints(), //Done
      },
  };

  return tableData;

}

export function mergeDamageGraphsFromMeta(entities) {
  const mergedMap = new Map();

  for (const entity of entities) {
    const graphData = entity.meta?.damageGraphData || [];
    for (const { time, totalDamage } of graphData) {
      mergedMap.set(time, (mergedMap.get(time) || 0) + totalDamage);
    }
  }

  const mergedPoints = Array.from(mergedMap.entries())
    .map(([time, totalDamage]) => ({ time, totalDamage }))
    .sort((a, b) => a.time - b.time);
  console.log("Merged Points:", mergedPoints);
  return mergedPoints;
}

/*
  // Parse metrics
  const damageDealt = getDamageDoneWithSpells(entityInteractionsDealt);
  const damageTaken = getDamageDoneWithSpells(entityInteractionsReceived);

  // Compute encounter length (seconds)
  const durationSec =
    (session.encounterLengthSec && session.encounterLengthSec > 0)
      ? session.encounterLengthSec
      : (session.endTime && session.startTime
          ? (session.endTime - session.startTime) / 1000
          : 1);

  // Derived DPS
  const dps = damageDealt.total / durationSec;

  return {
    name: entityObj.name || entityObj.displayName || "(unnamed)",
    totalDamage: damageDealt.total,
    totalDamageTaken: damageTaken.total,
    dps: dps.toFixed(1),
    hits: damageDealt.hitCount,
    minHit: damageDealt.minHit,
    maxHit: damageDealt.maxHit,
    resistedTotal: damageDealt.resistedTotal,
    blockedTotal: damageDealt.blockedTotal,
    crushingCount: damageDealt.crushingCount,
    breakdown: damageDealt.breakdown,
  };
}

// --- Helpers ---

function createStatsObj() {
  return {
    total: 0,
    count: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    avg: 0,
  };
}

function updateStats(stats, value) {
  if (!stats || value == null) return;
  stats.total += value;
  stats.count += 1;
  stats.min = Math.min(stats.min, value);
  stats.max = Math.max(stats.max, value);
}

export function getDamageDoneWithSpells(events) {
  const spellMap = {};
  const categories = [
    "normal",
    "resisted",
    "blocked",
    "absorbed",
    "critical",
    "glancing",
    "crushing",
    "total",
  ];

  const overallStats = {};
  categories.forEach((cat) => (overallStats[cat] = createStatsObj()));

  let total = 0;
  let overkillTotal = 0;
  let resistedTotal = 0;
  let blockedTotal = 0;
  let hitCount = 0;
  let crushingCount = 0;
  let minHit = Number.POSITIVE_INFINITY;
  let maxHit = Number.NEGATIVE_INFINITY;

  const missTypes = [
    "ABSORB", "BLOCK", "DEFLECT", "DODGE", "EVADE",
    "IMMUNE", "MISS", "PARRY", "REFLECT", "RESIST",
  ];
  const missed = {};
  missTypes.forEach((t) => (missed[t] = 0));

  events.forEach((e) => {
    const evt = e.event || e.eventType || "";
    const isDamage =
      evt.includes("DAMAGE") && !evt.includes("MISSED") && e.amount !== undefined;

    if (isDamage) {
      const spell =
        evt === "SWING_DAMAGE"
          ? "Swing"
          : e.spellName || e.abilityName || e.eventType || "Unknown";

      if (!spellMap[spell]) {
        spellMap[spell] = {};
        categories.forEach((cat) => (spellMap[spell][cat] = createStatsObj()));
      }

      const amt = e.amount || 0;
      updateStats(spellMap[spell].total, amt);
      updateStats(overallStats.total, amt);

      total += Math.max(0, amt - (e.overkill || 0));
      overkillTotal += e.overkill || 0;
      resistedTotal += e.resisted || 0;
      blockedTotal += e.blocked || 0;
      minHit = Math.min(minHit, amt);
      maxHit = Math.max(maxHit, amt);
      hitCount += 1;
      if (e.crushing) crushingCount += 1;

      if (e.resisted) updateStats(spellMap[spell].resisted, e.resisted);
      if (e.blocked) updateStats(spellMap[spell].blocked, e.blocked);
      if (e.absorbed) updateStats(spellMap[spell].absorbed, e.absorbed);
      if (e.critical) updateStats(spellMap[spell].critical, amt);
      if (e.glancing) updateStats(spellMap[spell].glancing, amt);
      if (e.crushing) updateStats(spellMap[spell].crushing, amt);
    } else if (evt.includes("MISSED")) {
      if (e.missType && missed[e.missType] !== undefined) missed[e.missType] += 1;
    }
  });

  const finalizeStats = (stats) => {
    if (stats.count === 0) {
      stats.min = 0;
      stats.max = 0;
      stats.avg = 0;
    } else {
      stats.avg = stats.total / stats.count;
    }
  };
  Object.values(spellMap).forEach((spellStats) =>
    categories.forEach((cat) => finalizeStats(spellStats[cat]))
  );
  categories.forEach((cat) => finalizeStats(overallStats[cat]));

  const breakdown = Object.entries(spellMap).map(([spell, stats]) => {
    const event =
      spell === "Swing"
        ? events.find((e) => (e.event || "").includes("SWING_DAMAGE"))
        : events.find(
            (e) =>
              (e.spellName || e.abilityName || e.eventType || "Unknown") === spell
          );
    return {
      spell,
      spellId: spell === "Swing" ? null : event?.spellId ?? null,
      spellSchool: event?.spellSchool ?? null,
      ...Object.fromEntries(categories.map((cat) => [cat, stats[cat]])),
    };
  });

  return {
    total,
    overkillTotal,
    resistedTotal,
    blockedTotal,
    hitCount,
    crushingCount,
    minHit: hitCount > 0 ? minHit : 0,
    maxHit: hitCount > 0 ? maxHit : 0,
    missed,
    breakdown,
  };
}
*/