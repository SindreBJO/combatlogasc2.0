// This is the initial table data generation for entities (players, NPCs, etc.)
export function getEntityTableData(data, entityObj, sessionIndex){
    if (!data.data || !data.sessions) return []
    const returnObject = {
        
    };

    const entityInteractionsDealt = data.data.filter((obj, index) => {
        return (
            index >= data.sessions[sessionIndex].dataIndexStart &&
            index <= data.sessions[sessionIndex].dataIndexEnd &&
            (
                (entityObj.processType === "ByName" &&
                    entityObj.name === obj.sourceName &&
                    entityObj.type === obj.sourceFlag
                ) ||
                (entityObj.processType === "ByID" &&
                    [entityObj.GUID].includes(obj.sourceGUID)
                )
            )
        );
    });
    const entityInteractionsRecieved = data.data.filter((obj, index) => {
        return (
            index >= data.sessions[sessionIndex].dataIndexStart &&
            index <= data.sessions[sessionIndex].dataIndexEnd &&
            (
                (entityObj.processType === "ByName" &&
                    entityObj.name === obj.destName &&
                    entityObj.type === obj.destFlag
                ) ||
                (entityObj.processType === "ByID" &&
                    [entityObj.GUID].includes(obj.destGUID)
                )
            )
        );
    });

    return {
        name: entityObj.name, // or entityObj.sourceName, depending on your data
        ...getDamageDoneWithSpells(entityInteractionsDealt),
        // ...add other metrics as needed
};
}


//These are helpers
function createStatsObj() {
    return {
        total: 0,
        count: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        avg: 0
    };
}

function updateStats(stats, value) {
    stats.total += value;
    stats.count += 1;
    stats.min = Math.min(stats.min, value);
    stats.max = Math.max(stats.max, value);
}

export function getDamageDoneWithSpells(events) {
    // Single-pass: process all events in one loop
    const spellMap = {};
    const categories = [
        'normal', 'resisted', 'blocked', 'absorbed', 'critical', 'glancing', 'crushing', 'total'
    ];
    // Totals
    let total = 0;
    let overkillTotal = 0;
    let resistedTotal = 0;
    let blockedTotal = 0;
    let hitCount = 0;
    let crushingCount = 0;
    let minHit = Number.POSITIVE_INFINITY;
    let maxHit = Number.NEGATIVE_INFINITY;

    // Missed types
    const missTypes = [
        "ABSORB", "BLOCK", "DEFLECT", "DODGE", "EVADE", "IMMUNE", "MISS", "PARRY", "REFLECT", "RESIST"
    ];
    const missed = {};
    missTypes.forEach(type => missed[type] = 0);

    const overallStats = {};
    categories.forEach(cat => overallStats[cat] = createStatsObj());

    events.forEach(e => {
        if (e.event[1] === "DAMAGE" || e.event[1] === "SWING_DAMAGE") {
            // For SWING_DAMAGE, use 'Swing' as spell and null for spellId
            const isSwing = e.event[1] === "SWING_DAMAGE";
            const spell = isSwing ? "Swing" : (e.spellName || e.abilityName || e.eventType || 'Unknown');
            if (!spellMap[spell]) {
                spellMap[spell] = {};
                categories.forEach(cat => spellMap[spell][cat] = createStatsObj());
            }
            // Always update total for per-spell stats
            updateStats(spellMap[spell].total, e.amount);
            updateStats(overallStats.total, e.amount);

            // Overkill
            if (e.overkill) {
                overkillTotal += e.overkill;
            }
            // Resisted
            if (e.resisted) {
                resistedTotal += e.resisted;
                updateStats(spellMap[spell].resisted, e.resisted);
                updateStats(overallStats.resisted, e.resisted);
            }
            // Blocked
            if (e.blocked) {
                blockedTotal += e.blocked;
                updateStats(spellMap[spell].blocked, e.blocked);
                updateStats(overallStats.blocked, e.blocked);
            }
            // Absorbed
            if (e.absorbed) {
                updateStats(spellMap[spell].absorbed, e.absorbed);
                updateStats(overallStats.absorbed, e.absorbed);
            }
            // Critical
            if (e.critical) {
                updateStats(spellMap[spell].critical, e.amount);
                updateStats(overallStats.critical, e.amount);
            }
            // Glancing
            if (e.glancing) {
                updateStats(spellMap[spell].glancing, e.amount);
                updateStats(overallStats.glancing, e.amount);
            }
            // Crushing
            if (e.crushing) {
                crushingCount += 1;
                updateStats(spellMap[spell].crushing, e.amount);
                updateStats(overallStats.crushing, e.amount);
            }
            // Count hits (including crushing)
            hitCount += 1;
            minHit = Math.min(minHit, e.amount);
            maxHit = Math.max(maxHit, e.amount);
            // Only count actual damage (not overkill)
            total += (e.amount - (e.overkill || 0));
        } else if (e.event[1] === "MISSED") {
            if (e.missType && missTypes.includes(e.missType)) {
                missed[e.missType] += 1;
            }
        }
    });

    // Calculate averages and fix min/max for empty
    function finalizeStats(stats) {
        if (stats.count === 0) {
            stats.min = 0;
            stats.max = 0;
            stats.avg = 0;
        } else {
            stats.avg = stats.total / stats.count;
        }
    }
    Object.values(spellMap).forEach(spellStats => {
        categories.forEach(cat => finalizeStats(spellStats[cat]));
    });
    categories.forEach(cat => finalizeStats(overallStats[cat]));

    // Build breakdown array
    const breakdown = Object.entries(spellMap).map(([spell, stats]) => {
        // Find a representative event for this spell
        let event;
        if (spell === "Swing") {
            event = events.find(e => e.event[1] === "SWING_DAMAGE");
        } else {
            event = events.find(e => (e.spellName || e.abilityName || e.eventType || 'Unknown') === spell);
        }
        return {
            spell,
            spellId: spell === "Swing" ? null : (event && event.spellId !== undefined ? event.spellId : null),
            spellSchool: event && event.spellSchool !== undefined ? event.spellSchool : null,
            ...Object.fromEntries(categories.map(cat => [cat, stats[cat]]))
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
        breakdown
    };
}

export function getDPS(data, playerObj, sessionIndex, encounterLength) {
    
}

export function getDamageSourcesBreakdown(data, playerObj, sessionIndex) {
    if (!data.data || !data.sessions) return [];
    const playerInteractionsDealt = data.data.filter((obj, idx) => {
        return (
            idx >= data.sessions[sessionIndex].startIndex &&
            idx <= data.sessions[sessionIndex].endIndex &&
            playerObj.sourceName === obj.sourceName &&
            playerObj.sourceFlag === obj.sourceFlag
        );
    });
    const damageEvents = playerInteractionsDealt.filter(e => e.type === "DAMAGE");
    const totalDamage = damageEvents.reduce((sum, e) => sum + e.amount, 0);
    const sourceMap = {};
    damageEvents.forEach(e => {
        const source = e.spellName || e.abilityName || e.eventType || 'Unknown';
        if (!sourceMap[source]) {
            sourceMap[source] = {
                amount: 0,
                count: 0,
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY
            };
        }
        sourceMap[source].amount += e.amount;
        sourceMap[source].count += 1;
        if (e.amount < sourceMap[source].min) sourceMap[source].min = e.amount;
        if (e.amount > sourceMap[source].max) sourceMap[source].max = e.amount;
    });
    const breakdown = Object.entries(sourceMap).map(([source, stats]) => ({
        source,
        amount: stats.amount,
        percent: totalDamage > 0 ? (stats.amount / totalDamage) * 100 : 0,
        count: stats.count,
        min: stats.count > 0 ? stats.min : 0,
        max: stats.count > 0 ? stats.max : 0,
        avg: stats.count > 0 ? stats.amount / stats.count : 0
    }));
    return breakdown;
}