import React, { createContext, useContext, useState } from 'react';

// Initial session data template
const initialSessionData = {
  // Variables declared on start or end of session
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
  outcome: "Unknown",
  startParse: null,
  endParse: null,
  // Variables updated during session
  bossName: "Trash",
  lastDamageTimestamp: null,
  lastDamageIndexAt: null,
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
};

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [currentSession, setCurrentSession] = useState({ ...initialSessionData });
  const [sessionActive, setSessionActive] = useState(false);
  const [sessions, setSessions] = useState([]);

  // Session logic functions
  const startSession = (payload) => {
    if (sessionActive) return;
    setCurrentSession({ ...initialSessionData, ...payload });
    setSessionActive(true);
    console.log("Session started", { ...initialSessionData, ...payload });
  };

  const endSession = (payload) => {
    if (!sessionActive) return;
    setCurrentSession(prev => ({ ...initialSessionData }));
    setSessions(sessions => [...sessions, { ...currentSession, ...payload }]);
    setSessionActive(false);
    console.log("Session ended", { ...currentSession, ...payload });
  };

  const resetSessionState = () => {
    setCurrentSession({ ...initialSessionData });
    setSessionActive(false);
    setSessions([]);
  };

  const addSessionMeta = (payload) => {
    setCurrentSession(prev => {
      const newSession = { ...prev };
      Object.entries(payload).forEach(([key, value]) => {
        if (!(key in newSession)) {
          newSession[key] = value;
        }
      });
      return newSession;
    });
  };

  const setLastDamageTimestamp = ({ timestamp, index }) => {
    setCurrentSession(prev => ({
      ...prev,
      lastDamageTimestamp: timestamp,
      lastDamageIndexAt: index,
    }));
  };

  const changeBossName = (newBossName) => {
    setCurrentSession(prev =>
      prev.bossName === 'Trash' ? { ...prev, bossName: newBossName } : prev
    );
  };

  const markEnemyNPCDead = ({ id, name }) => {
    setCurrentSession(prev => {
      const enemyNPCs = prev.entitiesData.enemyNPCs.map(entity => {
        if (entity.id === id && (!name || entity.names?.includes(name) || entity.name === name)) {
          return { ...entity, alive: false };
        }
        return entity;
      });
      return {
        ...prev,
        entitiesData: {
          ...prev.entitiesData,
          enemyNPCs,
        },
      };
    });
  };

  // ...implement tryAddEntityGeneral and tryAddEntityActionGeneral as needed...

  return (
    <SessionContext.Provider value={{
      currentSession,
      sessionActive,
      sessions,
      startSession,
      endSession,
      resetSessionState,
      addSessionMeta,
      setLastDamageTimestamp,
      changeBossName,
      markEnemyNPCDead,
      // tryAddEntityGeneral, tryAddEntityActionGeneral
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
