import { createSlice } from '@reduxjs/toolkit';

//Session Slice

// Higher level goals:
// 1. Manages session lifecycle: start, end, and reset sessions.
// 2. Maintains a list of completed sessions for historical data analysis.
// 3. Provides flexible metadata addition to sessions without overwriting existing data.

// Lower level goals:
// 1. Tracks session data at start and end; each completed session is pushed to the sessions array for later analysis.
// 2. Stores the last damage timestamp to assist with session timeout logic.
// 3. Records the last damage line index for reference during timeouts.
// 4. Tracks alive entities to manage session activity, especially for Mythic+ (m+) scenarios; future improvements planned for ID/name handling.
// 5. Renders unique entities by name or ID, supporting multi-ID/name entities based on affiliation, with correction constants available in helpers/constants.js.
// 6. Renders unique actions (dealt/received) for entities, supporting both byName and byId types, and includes all relevant action data.
// 7. Monitors state changes and yields data for debugging or future feature testing.

// Initial session data template
const initialSessionData = {
  day: null,
  month: null,
  year: null,
  startTime: null,
  startHour: null,
  startMinute: null,
  startSecond: null,
  startMillisecond: null,
  endTime: null,
  endHour: null,
  endMinute: null,
  endSecond: null,
  endMillisecond: null,
  encounterLengthMs: null,
  encounterLengthSec: null,
  dataIndexStart: null,
  dataIndexEnd: null,
  lastDamageIndex: 0,
  bossName: "Trash",
  outcome: "Unknown",
  startParse: null,
  endParse: null,
  entitiesData: {
    players: [],
    friendlyPlayers: [],
    pets: [],
    enemyPlayers: [],
    enemyNPCs: [],
    friendlyNPCs: [],
    neutralNPCs: [],
    hostileNPCs: [],
    unknowns: []
  },
  lastDamageTimestamp: null,
};

// Mapping from affiliation to entity list name for clarity and scalability
const affiliationToList = {
  player: 'players',
  friendlyPlayer: 'friendlyPlayers',
  pet: 'pets',
  enemyPlayer: 'enemyPlayers',
  enemyNPC: 'enemyNPCs',
  friendlyNPC: 'friendlyNPCs',
  neutralNPC: 'neutralNPCs',
  hostileNPC: 'hostileNPCs',
  unknown: 'unknowns',
};

// Redux slice for session management
const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    currentSession: { ...initialSessionData },
    sessionActive: false,
    sessions: [],
  },
  reducers: {
    // Add metadata to the current session, avoiding overwrites, flexible call for future test or uses, limited to top-level keys only
    addSessionMeta: (state, action) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        if (!(key in state.currentSession)) {
          state.currentSession[key] = value;
        }
      });
    },
    // Start a new session if none is active
    startSession: (state, action) => {
      if (state.sessionActive) return;
      state.currentSession = { ...initialSessionData, ...action.payload };
      state.sessionActive = true;
    },
    // End the current session if active
    endSession: (state, action) => {
      if (!state.sessionActive) return;
      if (action && action.payload) {
        Object.entries(action.payload).forEach(([key, value]) => {
          state.currentSession[key] = value;
        });
      }
      state.sessions.push({ ...state.currentSession });
      state.currentSession = { ...initialSessionData };
      state.sessionActive = false;
    },
    // Reset the entire session state, including all past sessions, only used for full reset
    resetSessionState: (state) => {
      state.currentSession = { ...initialSessionData };
      state.sessionActive = false;
      state.sessions = [];
    },
    /**
     * Adds an entity to the appropriate list in entitiesData based on affiliation.
     * Ensures uniqueness by name or id, and supports multi-id/name entities.
     * @param {Object} action - Redux action with payload: { affiliation, name, id }
     */
    tryAddEntityGeneral: (state, action) => {
      const { affiliation, name, id } = action.payload;
      const byNameAffiliations = ['player', 'pet', 'enemyPlayer', 'friendlyPlayer'];
      const byIdAffiliations = ['friendlyNPC', 'enemyNPC', 'neutralNPC', 'unknown'];
      let listName = affiliationToList[affiliation] || 'unknowns';
      if (byNameAffiliations.includes(affiliation)) {
        // Find entity by name
        let entity = state.currentSession.entitiesData[listName].find(e => e.name === name);
        if (!entity) {
          entity = {
            name,
            ids: [id],
            actions: { dealt: [], received: [] },
            entityType: 'byName',
          };
          state.currentSession.entitiesData[listName].push(entity);
        } else {
          if (!entity.ids.includes(id)) {
            entity.ids.push(id);
          }
        }
      } else if (byIdAffiliations.includes(affiliation)) {
        // Find entity by id
        let entity = state.currentSession.entitiesData[listName].find(e => e.id === id);
        if (!entity) {
          entity = {
            id,
            names: [name],
            actions: { dealt: [], received: [] },
            entityType: 'byId',
            ...(listName === 'enemyNPCs' ? { alive: true } : {}),
          };
          state.currentSession.entitiesData[listName].push(entity);
        } else {
          if (!entity.names.includes(name)) {
            entity.names.push(name);
          }
        }
      } else {
        // Unknown or missing affiliation, add to unknowns by id
        let entity = state.currentSession.entitiesData['unknowns'].find(e => e.id === id);
        if (!entity) {
          entity = {
            id,
            names: [name],
            actions: { dealt: [], received: [] },
            entityType: 'byId',
          };
          state.currentSession.entitiesData['unknowns'].push(entity);
        } else {
          if (!entity.names.includes(name)) {
            entity.names.push(name);
          }
        }
      }
    },
    /**
     * Adds a unique action (dealt/received) to an entity, based on affiliation and entity type.
     * Logs a warning if no matching entity is found.
     * @param {Object} action - Redux action with payload: { affiliation, name, id, spellName, spellId, spellSchool, isBuff, isSourceEntity }
     */
    tryAddEntityActionGeneral: (state, action) => {
      const { affiliation, name, id, spellName, spellId, spellSchool, isBuff, isSourceEntity } = action.payload;
      const byNameAffiliations = ['player', 'pet', 'enemyPlayer', 'friendlyPlayer'];
      const byIdAffiliations = ['friendlyNPC', 'enemyNPC', 'neutralNPC', 'unknown'];
      let listName = affiliationToList[affiliation] || 'unknowns';
      // Find all possible matching entities (byId, byName, or legacy)
      const entities = state.currentSession.entitiesData[listName].filter(e => {
        if (e.entityType === 'byName') {
          return e.name === name && Array.isArray(e.ids) && e.ids.includes(id);
        } else if (e.entityType === 'byId') {
          return e.id === id && Array.isArray(e.names) && e.names.includes(name);
        } else {
          return e.id === id && e.name === name;
        }
      });
      if (!entities.length) {
        // Example for point 6: log a warning if no entity is found
        if (typeof window !== 'undefined' && window.console) {
          window.console.warn && window.console.warn(`No entity found for action: ${affiliation}, ${name}, ${id}`);
        }
        return;
      }
      entities.forEach(entity => {
        const actionList = isSourceEntity ? entity.actions.dealt : entity.actions.received;
        const exists = actionList.some(a => a.spellName === spellName && a.spellId === spellId);
        if (!exists) {
          actionList.push({ spellName, spellId, spellSchool, isBuff });
        }
      });
    },
    setLastDamageTimestamp: (state, action) => {
      state.currentSession.lastDamageTimestamp = action.payload;
    },
    changeBossName: (state, action) => {
      const newBossName = action.payload;
      if (state.currentSession.bossName === 'Trash') {
        state.currentSession.bossName = newBossName;
      }
    },
    // Mark an enemyNPC as dead (alive = false) by id (and optionally name)
    markEnemyNPCDead: (state, action) => {
      const { id, name } = action.payload;
      const enemyNPCs = state.currentSession.entitiesData.enemyNPCs;
      if (!enemyNPCs) return;
      enemyNPCs.forEach(entity => {
        if (entity.id === id && (!name || entity.names?.includes(name) || entity.name === name)) {
          entity.alive = false;
        }
      });
    },
  }
});

export const { addSessionMeta, endSession, startSession, resetSessionState, tryAddEntityGeneral, tryAddEntityActionGeneral, setLastDamageTimestamp, changeBossName, markEnemyNPCDead } = sessionSlice.actions;
export default sessionSlice.reducer;
