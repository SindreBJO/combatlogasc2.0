import React, { createContext, useEffect, useState } from 'react';

// Parsing helpers
import { parseString, setGlobalYear, testArrayLength } from '../helpers/parseHelpers.js';
// Constants
import { BOSSNAMES, MultipleIdEnemyNPCs, bannedNames, MultipleNameEnemyNPCs, bypassEndByDIEDSessionCheckNames, bannedPetNames, clutterMobsOrMultipleBossNames } from '../helpers/constants.js';

export const DataContext = createContext();

// Define chunk size for file reading and progress tracking
const CHUNK_SIZE = 50 * 1024;

// DataContextProvider component to manage file reading, parsed data and meta data.
export const DataContextProvider = ({ children }) => {

    // UI states
    const [progress, setProgress] = useState('Ready for use');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [finishedParsing, setFinishedParsing ] = useState(false);
    const [startNewSession, setStartNewSession ] = useState(false);

    // Input states
    const [inputYear, setInputYear] = useState();
    const [inputDamageTimeout, setInputDamageTimeout] = useState();

    // Parsed data state
    const [data, setData] = useState([]);

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
      ressurections: [],
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

    let metaData = {
        sessions:[],
        data: [],
        invalidData: [],
        dataIndexStart: null,
        dataIndexEnd: null,
        dataTimeLength: null,
        dataTimeStampStart: null,
        dataTimeStampEnd: null,
        knownErrorsLogged: []
    };

    // Current year or input year for correct date parsing
    useEffect(() => {
        setGlobalYear(inputYear || new Date().getFullYear())
    }, [inputYear]);

    // Default damage timeout for sessions, with a range check (20-120s)
    useEffect(() => {
        if (inputDamageTimeout > 120 || inputDamageTimeout < 20 || inputDamageTimeout === undefined) {
            setInputDamageTimeout(50);
        }
    }, [inputDamageTimeout]);

    //Initialize reader and related variables
    const reader = new FileReader();
    let offset = 0;
    let carryOver = '';

    // Line index and current parsed object
    let indexLine = 0;
    let currentParsedObject = null;

    // Local session state for parsing
    let currentSession = {...initialSessionData}
    let sessionActive = false;

    // MAIN FILE for reading and storing parsed data, executed when a new file is provided/dropped
    function readNewFile(file) {
        // Reset all variables
        setData([]);
        setValidLinesCount(0);
        setInvalidLinesCount(0);
        setProgress('Loadingstate');
        setProgressPercentage(0);
        setSessionCount(0);
        setStartNewSession(false);
        // Reset session context state

        // Reset local session state
        sessionActive = false;
        currentSession = null;
        metaData = {
            sessions:[],
            data: [],
            invalidData: [],
            dataIndexStart: null,
            dataIndexEnd: null,
            dataTimeLength: null,
            dataTimeStampStart: null,
            dataTimeStampEnd: null,
        };
        currentSession = {...initialSessionData};
        indexLine = 0;
        currentParsedObject = null;
        offset = 0;
        carryOver = '';

        let fullTimer = 0;
        let parseTimer = 0;
        let fullSessionTimer = 0;
        let uniqueEntityTimer = 0;
        let uniqueActionTimer = 0;

        const fullTimerStart = performance.now();

        reader.onload = (event) => {
            const text = carryOver + event.target.result;
            const newLines = text.split('\n');
            carryOver = newLines.pop();
            newLines.forEach(line => { 
                processParse(line);
            });
            offset += CHUNK_SIZE;
            setProgress(`Progress: ${(Math.min(offset, file.size) * 100 / file.size).toFixed(2)} %`);
            setProgressPercentage(((offset / file.size) * 100));
            if (offset < file.size) {
                readNextChunk();
            } else {
                metaData.dataIndexEnd = indexLine;
                metaData.dataTimeStampEnd = currentParsedObject?.timeStamp;
                processParse(carryOver);
                setProgress('File reading completed.');
                setProgressPercentage(100);
                const fullTimerEnd = performance.now();
                fullTimer += fullTimerEnd - fullTimerStart
                console.log("Full Rundown Time:", fullTimer, "ms", metaData.data.length + metaData.invalidData.length, "lines");
                console.log("Parsing Time:", parseTimer, "ms ", ((parseTimer / fullTimer) * 100).toFixed(2), "% of total");
                console.log("Full Session Handling Time:", fullSessionTimer, "ms ", ((fullSessionTimer / fullTimer) * 100).toFixed(2), "% of total");
                console.log("Unique Entity Handling Time:", uniqueEntityTimer, "ms ", ((uniqueEntityTimer / fullTimer) * 100).toFixed(2), "% of total");
                console.log("Unique Action Handling Time:", uniqueActionTimer, "ms ", ((uniqueActionTimer / fullTimer) * 100).toFixed(2), "% of total");
                metaData.dataTimeLength = metaData.dataTimeStampEnd - metaData.dataTimeStampStart;
                setData(metaData);
                console.log("Finished parsing file. MetaData:", metaData);
                setFinishedParsing(true);
                // After parsing, update session context if needed
                if (currentSession) {

                }
                // Optionally, add parsed sessions to context here
                // metaData.sessions.forEach(sess => startSession(sess));
            }
        }

        const readNextChunk = () => {
            const blob = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsText(blob);
        };

        // Function for parsing each line and handling sessions depending on the parsed line.
        function processParse(currentUnparsedLine){
          const parseTimerStart = performance.now();
            currentParsedObject = parseString(currentUnparsedLine);
            const parseTimerEnd = performance.now();
                parseTimer += parseTimerEnd - parseTimerStart
            if (bannedNames.includes(currentParsedObject.sourceName) || bannedNames.includes(currentParsedObject.destName)) { return; }
            if (currentParsedObject) {
                if (metaData.dataIndexStart === null) { metaData.dataTimeStampStart = currentParsedObject.timeStamp }
                if (metaData.dataTimeStampStart === null) { metaData.dataTimeStampStart = currentParsedObject.timeStamp }

                processSession();
                setValidLinesCount(prevCount => prevCount + 1);
                metaData.data.push(currentParsedObject);
                indexLine++;
            }
            if (currentUnparsedLine === "" || currentUnparsedLine === "\r") { return } // Skips all empty lines
            if (currentParsedObject === false) {
                setInvalidLinesCount(prevCount => prevCount + 1);
                metaData.invalidData.push(currentUnparsedLine.replace(/\r/g, ''));
                return;
            }
        }

        // SESSION HANDLING (local, then context after parsing)
        const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        

        

        function processSession() {
          const fullSessionTimerStart = performance.now();
            if (checkSessionStartCondition()) { startSession() }
            if (sessionActive) {
              const uniqueEntityTimerStart = performance.now();
                tryAddUniqueEntity(currentParsedObject.sourceFlag, currentParsedObject.sourceName, currentParsedObject.sourceGUID);
                tryAddUniqueEntity(currentParsedObject.destFlag, currentParsedObject.destName, currentParsedObject.destGUID);
              const uniqueEntityTimerEnd = performance.now();
              uniqueEntityTimer += uniqueEntityTimerEnd - uniqueEntityTimerStart
              const uniqueActionTimerStart = performance.now();
                tryAddEntityUniqueAction(currentParsedObject.sourceFlag, currentParsedObject.sourceName, currentParsedObject.sourceGUID, currentParsedObject.spellName, currentParsedObject.spellId, currentParsedObject.spellSchool, true, /*is SourceEntity*/);
                tryAddEntityUniqueAction(currentParsedObject.destFlag, currentParsedObject.destName, currentParsedObject.destGUID, currentParsedObject.spellName, currentParsedObject.spellId, currentParsedObject.spellSchool, false /*is not SourceEntity*/);
              const uniqueActionTimerEnd = performance.now();
              uniqueActionTimer += uniqueActionTimerEnd - uniqueActionTimerStart
                checkPlayerResurrected();
                checkEntityAliveStatus();
                checkBossName(currentParsedObject.sourceFlag, currentParsedObject.sourceName);
                checkBossName(currentParsedObject.destFlag, currentParsedObject.destName);
                if ( checkDamageAction() ) { updateLastDamageTimestampAndIndex() }
                if (checkSessionEndCondition()) {
                    endSession() 
                }
            }
          const fullSessionTimerEnd = performance.now();
          fullSessionTimer += fullSessionTimerEnd - fullSessionTimerStart
        }
        function checkDamageAction() {
            return ["DAMAGE", "MISSED"].includes(currentParsedObject.event[1]);
        }
        function updateLastDamageTimestampAndIndex() {
                currentSession.lastDamageTimestamp = currentParsedObject.timeStamp;
                currentSession.lastDamageIndexAt = indexLine;
        }
        function checkSessionStartCondition () {
            if (!sessionActive && ["DAMAGE", "MISSED"].includes(currentParsedObject.event[1]) && currentParsedObject.event[0] !== "ENVIRONMENTAL" && ["player", "enemyNPC"].includes(currentParsedObject.sourceFlag) && ["player", "enemyNPC"].includes(currentParsedObject.destFlag) && (currentParsedObject.sourceName !== currentParsedObject.destName)) {
                return true
            } else { return false }
        }
        function checkBossName (affilication, name) {
            if (sessionActive && currentSession?.bossName === "Trash" && BOSSNAMES.includes(name) && affilication === "enemyNPC") {
                currentSession.bossName = name;
            }
        }
        function startSession () {
            if (sessionActive) {
                metaData.knownErrorsLogged.push(`Fail to start session at line ${indexLine}: session already active.`)
                return
            }
            currentSession = JSON.parse(JSON.stringify(initialSessionData));
            currentSession.day = WEEKDAYS[new Date(currentParsedObject.timeStamp).getDay()];
            currentSession.dayNumber = new Date(currentParsedObject.timeStamp).getDate();
            currentSession.month = MONTHS[new Date(currentParsedObject.timeStamp).getMonth()];
            currentSession.monthNumber = new Date(currentParsedObject.timeStamp).getMonth() + 1;
            currentSession.year = new Date(currentParsedObject.timeStamp).getFullYear();
            currentSession.startTime = currentParsedObject ? currentParsedObject.timeStamp : null;
            currentSession.startHour = new Date(currentParsedObject.timeStamp).getHours();
            currentSession.startMinute = new Date(currentParsedObject.timeStamp).getMinutes();
            currentSession.startSecond = new Date(currentParsedObject.timeStamp).getSeconds();
            currentSession.startMillisecond = new Date(currentParsedObject.timeStamp).getMilliseconds();
            currentSession.dataIndexStart = indexLine;
            currentSession.startParse = currentParsedObject ? currentParsedObject : null;
            currentSession.lastDamageTimestamp = currentParsedObject ? currentParsedObject.timeStamp : null;
            currentSession.lastDamageIndexAt = indexLine;
            sessionActive = true;
        }

        const affiliationToList = {
          player: 'players',
          pet: 'pets',
          enemyPlayer: 'enemyPlayers',
          friendlyPlayer: 'friendlyPlayers',
          friendlyNPC: 'friendlyNPCs',
          enemyNPC: 'enemyNPCs',
          neutralNPC: 'neutralNPCs',
          unknown: 'unknowns'
        };

        function tryAddUniqueEntity(affiliation, name, id) {
          if (name === undefined || name === null) { return; }
          name = String(name);
          if (
              (name.includes("Unknown") || name.includes("unknown")) &&
              ["player", "pet"].includes(affiliation)
            ) {
              return;
            }
          if (
              typeof name === "string" &&
              bannedPetNames.some(keyword => name.toLowerCase().includes(keyword)) &&
              affiliation === "pet"
            ) {
              return; // skip banned pets
            }
          if (
            clutterMobsOrMultipleBossNames.some(([mobName]) => mobName.includes(name)) &&
            !["player", "pet"].includes(affiliation)
          ) {
            const match = clutterMobsOrMultipleBossNames.find(([mobName]) => mobName.includes(name));
            if (match) {
              const [, matchedId] = match; // destructure to get ID

              if (name === currentParsedObject.sourceName && affiliation === currentParsedObject.sourceFlag) {
                currentParsedObject.sourceGUID= matchedId;
                id = matchedId;
              }
          
              if (name === currentParsedObject.destName && affiliation === currentParsedObject.destFlag) {
                currentParsedObject.destGUID = matchedId;
                id = matchedId;
              }
            
            }
          }



          const byNameAffiliations = ['player', 'pet', 'enemyPlayer', 'friendlyPlayer'];
          const byIdAffiliations = ['friendlyNPC', 'enemyNPC', 'neutralNPC', 'unknown'];
          let listName = affiliationToList[affiliation] || 'unknowns';

          if (byNameAffiliations.includes(affiliation) || (MultipleIdEnemyNPCs.includes(name) && affiliation === 'enemyNPC')) {
            let entity = currentSession.entitiesData[listName].find(e => e.name === name);
            if (!entity) {
              entity = {
                name,
                ids: [id],
                actions: { dealt: [], received: [] },
                processType: 'byName',
                entityType: affiliation,
                diedAt: [],
                ressurectedAt: [],
                ...(listName === 'players' || listName === 'enemyNPCs' ? { alive: true } : {}),
              };
              currentSession.entitiesData[listName].push(entity);
            } else {
              if (!entity.ids.includes(id)) {
                entity.ids.push(id);
              }
            }
          } else if (byIdAffiliations.includes(affiliation)) {
            let entity = currentSession.entitiesData[listName].find(e => e.id === id);
            if (!entity) {
              entity = {
                id,
                names: [name],
                actions: { dealt: [], received: [] },
                processType: 'byId',
                entityType: affiliation,
                diedAt: [],
                ressurectedAt: [],
                ...(listName === 'enemyNPCs' ? { alive: true } : {}),
              };
              currentSession.entitiesData[listName].push(entity);
            } else {
              if (!entity.names.includes(name)) {
                entity.names.push(name);
              }
            }
          } else {
            let entity = currentSession.entitiesData['unknowns'].find(e => e.id === id);
            if (!entity) {
              entity = {
                id,
                names: [name],
                actions: { dealt: [], received: [] },
                processType: 'byId',
                entityType: affiliation,
                diedAt: [],
                ressurectedAt: []
              };
              currentSession.entitiesData['unknowns'].push(entity);
            } else {
              if (!entity.names.includes(name)) {
                entity.names.push(name);
              }
            }
          }
        }

        function tryAddEntityUniqueAction(affiliation, name, id, spellName, spellId, spellSchool, isSourceEntity) {
          const byNameAffiliations = ['player', 'pet', 'enemyPlayer', 'friendlyPlayer'];
          const byIdAffiliations = ['friendlyNPC', 'enemyNPC', 'neutralNPC', 'unknown'];
          let listName = affiliationToList[affiliation] || 'unknowns';

          const entities = currentSession.entitiesData[listName].filter(e => {
            if (e.processType === 'byName') {
              return e.name === name && Array.isArray(e.ids) && e.ids.includes(id);
            } else if (e.processType === 'byId') {
              return e.id === id && Array.isArray(e.names) && e.names.includes(name);
            } else {
              return e.id === id && e.name === name;
            }
          });

          entities.forEach(entity => {
            const actionList = isSourceEntity ? entity.actions.dealt : entity.actions.received;
            const exists = actionList.some(a => a.spellName === spellName && a.spellId === spellId);
            if (!exists) {
              actionList.push({ spellName, spellId, spellSchool });
            }
          });
        }

        function checkEntityAliveStatus() {
            if (currentParsedObject.event[1] === "UNITDIED") {
                // Check enemyNPCs (byId)
                currentSession.entitiesData.enemyNPCs.forEach(entity => {
                if (
                    entity.processType === "byId" &&
                    entity.id === currentParsedObject.destGUID &&
                    entity.names.includes(currentParsedObject.destName)
                ) {
                    entity.alive = false;
                    entity.diedAt.push({
                        timeStamp: currentParsedObject.timeStamp,
                        indexLine: indexLine
                    });
                }
                // Also check byName for bosses in MultipleIdEnemyNPCs
                if (
                    entity.processType === "byName" &&
                    entity.name === currentParsedObject.destName
                ) {
                    entity.alive = false;
                    entity.diedAt.push({
                        timeStamp: currentParsedObject.timeStamp,
                        indexLine: indexLine
                    });
                }
            });
                // Check players (byName)
                currentSession.entitiesData.players.forEach(entity => {
                    if (
                        entity.processType === "byName" &&
                        entity.name === currentParsedObject.destName &&
                        entity.ids.includes(currentParsedObject.destGUID)
                    ) {
                        entity.alive = false;
                        entity.diedAt.push({
                            timeStamp: currentParsedObject.timeStamp,
                            indexLine: indexLine
                        });
                    }
                });
            }
        }

        function checkPlayerResurrected() {
            if (
                currentParsedObject.event[1] === "RESURRECT" &&
                currentParsedObject.sourceFlag === "player" &&
                currentParsedObject.destFlag === "player"
            ) {
                const resurrected = currentSession.entitiesData.players.find(
                    e => e.name === currentParsedObject.destName && e.ids.includes(currentParsedObject.destGUID)
                );
                if (resurrected) {
                    resurrected.alive = true;
                    resurrected.ressurectedAt.push({
                        name: resurrected.name,
                        id: resurrected.ids[0],
                        timeStamp: currentParsedObject.timeStamp,
                        indexLine: indexLine
                    });
                } else {
                    metaData.knownErrorsLogged.push(`RESURRECT event failed for unknown player ${currentParsedObject.destName} at line ${indexLine}.`);
                }
            }
        }

        
        function checkSessionEndCondition () {
            if (sessionActive && ((currentParsedObject.destName === currentSession?.bossName) || (MultipleNameEnemyNPCs[0].includes(currentSession?.bossName) && MultipleNameEnemyNPCs[0].includes(currentParsedObject.destName))) && (currentParsedObject.event[1] === "UNITDIED")) {
                currentSession.outcome = "VictoryBoss";        
                return true;
            } else if (
                currentSession.bossName === "Trash" &&
                Array.isArray(currentSession.entitiesData.enemyNPCs) &&
                currentSession.entitiesData.enemyNPCs.length > 0 &&
                currentSession.entitiesData.enemyNPCs.every(e => e.alive === false) &&
                !currentSession.entitiesData.enemyNPCs.some(e =>
                  e.names?.some(name => bypassEndByDIEDSessionCheckNames.includes(name))
                )
            ) {
                currentSession.outcome = "VictoryTrash";
                return true;
            } else if ((currentParsedObject.timeStamp - currentSession.lastDamageTimestamp) > (inputDamageTimeout * 1000)) {
                currentSession.outcome = "Timeout";
                return true;
            } else if (
                currentSession.entitiesData.players.length > 0 &&
                currentSession.entitiesData.players.every(e => e.alive === false)
            ) {
                currentSession.outcome = "Wipe";
                return true;
            }
            return false;
        }

        function endSession() {
            if (!sessionActive) {
                metaData.knownErrorsLogged.push(`Fail to end session at line ${indexLine}: no session active.`);
                return;
            }
            currentSession = {
                ...currentSession,
                endTime: currentParsedObject ? currentParsedObject.timeStamp : null,
                endHour: new Date(currentParsedObject.timeStamp).getHours(),
                endMinute: new Date(currentParsedObject.timeStamp).getMinutes(),
                endSecond: new Date(currentParsedObject.timeStamp).getSeconds(),
                endMillisecond: new Date(currentParsedObject.timeStamp).getMilliseconds(),
                dataIndexEnd: indexLine,
                endParse: currentParsedObject ? currentParsedObject : null,
                encounterLengthMs: currentParsedObject && currentSession.startTime ? currentParsedObject.timeStamp - currentSession.startTime : null,
                encounterLengthSec: currentParsedObject && currentSession.startTime ? (currentParsedObject.timeStamp - currentSession.startTime) / 1000 : null,
            };
            sessionActive = false;
            metaData.sessions.push({ ...currentSession });
            setSessionCount(prevCount => prevCount + 1);
        }

        readNextChunk();
    }

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, inputYear, setInputYear, setInputDamageTimeout, finishedParsing, setFinishedParsing, startNewSession, setStartNewSession }}>
            {children}
        </DataContext.Provider>
    );
}