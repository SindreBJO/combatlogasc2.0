// Utility functions for combat log analysis

export function getEntityTableData(data, entityObj, sessionIndex){
    if (!data.data || !data.sessions) return []

    const entityInteractionsDealt = data.data.filter((obj, index) => {
        return (
            index >= data.sessions[sessionIndex].dataIndexStart &&
            index <= data.sessions[sessionIndex].dataIndexEnd &&
            (
                (entityObj.processType === "ByName" &&
                    entityObj.name === obj.sourceName && // <-- use obj.sourceName, not obj.name
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

export function getDamageDoneWithSpells(events) {
    const damageEvents = events.filter(e => e.event[1] === "DAMAGE");
    const totalDamage = damageEvents.reduce((sum, e) => sum + e.amount, 0);
    const spellMap = {};
    damageEvents.forEach(e => {
        const spell = e.spellName || e.abilityName || e.eventType || 'Unknown';
        if (!spellMap[spell]) {
            spellMap[spell] = {
                amount: 0,
                count: 0,
                min: Number.POSITIVE_INFINITY,
                max: Number.NEGATIVE_INFINITY
            };
        }
        spellMap[spell].amount += e.amount;
        spellMap[spell].count += 1;
        if (e.amount < spellMap[spell].min) spellMap[spell].min = e.amount;
        if (e.amount > spellMap[spell].max) spellMap[spell].max = e.amount;
    });
    const breakdown = Object.entries(spellMap).map(([spell, stats]) => ({
        spell,
        amount: stats.amount,
        percent: totalDamage > 0 ? (stats.amount / totalDamage) * 100 : 0,
        count: stats.count,
        min: stats.count > 0 ? stats.min : 0,
        max: stats.count > 0 ? stats.max : 0,
        avg: stats.count > 0 ? stats.amount / stats.count : 0
    }));
    return { totalDamage, breakdown };
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