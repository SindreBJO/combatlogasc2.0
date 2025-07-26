import React, { createContext, useEffect, useState } from 'react';
import { parseString, damageEventCheck, setGlobalYear, testArrayLength } from '../helpers/parseHelpers.js';
import { BOSSNAMES, MultipleIdMonsters } from '../helpers/constants.js';

export const DataContext = createContext();
// File is read, parsed data is stored, tests are done and sessions are declared here

const CHUNK_SIZE = 50 * 1024;

export const DataContextProvider = ({ children }) => {
    const [progress, setProgress] = useState('Ready for use');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [data, setData] = useState([]);
    const [sessions , setSessions] = useState([]);
    const [sessionCount, setSessionCount] = useState(0);
    const [inputYear, setInputYear] = useState();
    const [inputDamageTimeout, setInputDamageTimeout] = useState();

    useEffect(() => {
        setGlobalYear(inputYear || new Date().getFullYear())
    }, [inputYear],[]);

    useEffect(() => {
        if (inputDamageTimeout > 120 || inputDamageTimeout < 20 || inputDamageTimeout === undefined) {
            setInputDamageTimeout(50);
        }
    }, [inputDamageTimeout], []);

    
    const reader = new FileReader();
    let offset = 0;
    let carryOver = '';

    //Session variables
    let currentSessionData = {
        day: "Error",
        month: "Error",
        year: "Error",
        startTime: 0,
        startHour: 0,
        startMinute: 0,
        startSecond: 0,
        startMillisecond: 0,
        endTime: 0,
        endHour: 0,
        endMinute: 0,
        endSecond: 0,
        endMillisecond: 0,
        encounterLength: 0,
        dataIndexStart: 0,
        dataIndexEnd: 0,
        bossName: "None",
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
            unknownNPCs: []
        }

    };
    let sessionActive = false;
    let previousDamageParseTimeStamp;
    let previousDamageLineCount;

    //Indications
    let playerList = [];
    let petList = [];
    let playerControledNPCList = [];
    let friendlyNPCList = [];
    let neutralNPCList = [];
    let hostileNPCList = [];
    let unknownNPCList = [];

    let sourceFlagTest = [];
    let sourceFlagTestLines = [];

    let testSchoolList = [];

    let lengthTestData = []

    let eventTestData = {
        uniqueEvents: [],
        uniqueEventsExampleParses: []
    };

    let affiliationTestData = {
        playerList: [],
        petList: [],
        enemyPlayerList: [],
        friendlyPlayerList: [],
        friendlyNPCList: [],
        neutralNPCList: [],
        enemyNPCList: [],
        unknownNPCList: [],
        noneList: []
    };

    //Test variables
    let playerCount = 0;
    let petCount = 0;
    let enemyPlayerCount = 0;
    let friendlyPlayerCount = 0;
    let friendlyNPCCount = 0;
    let neutralNPCCount = 0;
    let enemyNPCCount = 0;
    let unknownNPCCount = 0;
    let noneCount = 0;

    //Currentparse variable
    let parsedObject = null;

    //Tracking variables
    let linesCount = 0;

    //Meta data
    let metaData = {
        sessions:[],
        data: [],
        dataIndexStart: 0,
        dataIndexEnd: 0,
        dataTimeLength: 0,
        dataTimeStampStart: 0,
        dataTimeStampEnd: 0,
    };
    let invalidData = [];

    function readNewFile(file) {
        
        setData([]);
        setValidLinesCount(0);
        setInvalidLinesCount(0);
        setProgress('Loadingstate');
        setProgressPercentage(0);
        setSessionCount(0);
        setSessions([]);

        //Read the file
        reader.onload = (event) => {

            //Split the file into lines
            const text = carryOver + event.target.result;
            const newLines = text.split('\n');
            carryOver = newLines.pop();
            //Parse each line
            newLines.forEach(line => {
                handleParse(line);
            });
            //Update the progress
            offset += CHUNK_SIZE;
            setProgress(`Progress: ${(Math.min(offset, file.size) * 100 / file.size).toFixed(3)} %`);
            setProgressPercentage((offset / file.size) * 100);

            //Read the next chunk
            if (offset < file.size) {
                readNextChunk();
            } else {
                metaData.dataIndexEnd = linesCount;
                metaData.dataTimeStampEnd = parsedObject.timeStamp;
                handleParse(carryOver);
                
                //Finished reading the file and parse the data

                setProgress('File reading completed.');
                setProgressPercentage(100);
                
                metaData.dataTimeLength = metaData.dataTimeStampEnd - metaData.dataTimeStampStart;
                setData(metaData);
                console.log(parsedObject)
                console.log (" ");
                console.log('----- File reading -----');
                console.log(" ");
                console.log('%cCompleted', 'color: green');
                console.log(" ")

                //LENGTH TEST DECLARATION

                console.log("----- Length Test: -----")
                console.log(" ")

                if (lengthTestData.length === 0) {
                    console.log(`${(( linesCount - lengthTestData.length)/(linesCount)).toFixed(5) * 100} %c% test coverage`, 'color: green')
                } else {
                    console.log('%cFailed Length Parses:', 'color: red');
                    console.log(lengthTestData);
                    console.log(`${(( linesCount - lengthTestData.length)/(linesCount)).toFixed(5) * 100} %c% test coverage`, 'color: green')
                }
                
                console.log(" ")
                console.log("----- Entity Test -----")
                console.log(" ")
                console.log("Player Count: " + playerCount);
                console.log("Pet Count: " + petCount);
                console.log("Enemy Player Count: " + enemyPlayerCount);
                console.log("Friendly Player Count: " + friendlyPlayerCount);
                console.log("Friendly NPC Count: " + friendlyNPCCount);
                console.log("Neutral NPC Count: " + neutralNPCCount);
                console.log("Enemy NPC Count: " + enemyNPCCount);
                console.log("Unknown NPC Count: " + unknownNPCCount);
                console.log("None Count: " + noneCount);
                console.log(" ")
                let total = playerCount + petCount + enemyPlayerCount + friendlyPlayerCount + friendlyNPCCount + neutralNPCCount + enemyNPCCount + unknownNPCCount + noneCount;
                console.log("%cTotal Count: " + total, 'color: green');
                console.log((total/(linesCount * 2)) * 100 + "%c % test coverage", 'color: green')
                console.log(" ")
                console.log("----- Event Tests: -----")
                console.log(" ")
                console.log("%cUnique Events:", 'color: green');
                console.log(eventTestData.uniqueEvents);
                console.log("%cUnique Events Example Parses:", 'color: green');
                console.log(eventTestData.uniqueEventsExampleParses);
                console.log(" ")
                console.log("Unique Units:")
                console.log(affiliationTestData);
                console.log("Meta Data:")
                console.log(metaData);
                console.log("linesCount: " + linesCount);
            }   
                
        }

            const readNextChunk = () => {
                const blob = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(blob);
            };

            //Handles the parsing of the line
        function handleParse(unparsedLine){
            parsedObject = parseString(unparsedLine);
            if (parsedObject) {
                if (metaData.dataTimeStampStart === 0) { metaData.dataTimeStampStart = parsedObject.timeStamp }
                handleSession();
                lengthTest(parsedObject, unparsedLine);
                affiliationTest(parsedObject)
                setValidLinesCount(prevCount => prevCount + 1);
                
                metaData.data.push(parsedObject);
                linesCount++;
            }
            if (unparsedLine === "" || unparsedLine === "\r") { return } // Skips all empty lines
            if (parsedObject === false) {
                setInvalidLinesCount(prevCount => prevCount + 1);
                invalidData.push(unparsedLine.replace(/\r/g, ''));
            return;
            }
        }

            function lengthTest(obj, string) {
              const [parsedArrayLength, parsedArray] = testArrayLength(string);
              if (parsedArrayLength != Object.keys(obj).length){
                 lengthTestData.push(["Expected: " + parsedArrayLength, "Actual: " + Object.keys(obj).length, parsedArray]);
              }
            }

            function eventTest(obj) {

            }

            function affiliationTest(obj){

                const sourceFlag = obj.sourceFlag;
                const destFlag = obj.destFlag;

                if (sourceFlag === "player") {
                    if (!affiliationTestData.playerList.includes(obj.sourceName)) {
                        affiliationTestData.playerList.push(obj.sourceName);
                    }
                    playerCount++;
                } else if (sourceFlag === "pet") {
                    if (!affiliationTestData.petList.includes(obj.sourceName)) {
                        affiliationTestData.petList.push(obj.sourceName);
                    }
                    petCount++;
                } else if (sourceFlag === "friendlyNPC") {
                    if (!affiliationTestData.friendlyNPCList.includes(obj.sourceName)) {
                        affiliationTestData.friendlyNPCList.push(obj.sourceName);
                    }
                    friendlyNPCCount++;
                } else if (sourceFlag === "enemyPlayer") {
                    if (!affiliationTestData.enemyPlayerList.includes(obj.sourceName)) {
                        affiliationTestData.enemyPlayerList.push(obj.sourceName);
                    }
                    enemyPlayerCount++;
                } else if (sourceFlag === "friendlyPlayer") {
                    if (!affiliationTestData.friendlyPlayerList.includes(obj.sourceName)) {
                        affiliationTestData.friendlyPlayerList.push(obj.sourceName);
                    }
                    friendlyPlayerCount++;
                } else if (sourceFlag === "enemyNPC") {
                    if (!affiliationTestData.enemyNPCList.includes(obj.sourceName)) {
                        affiliationTestData.enemyNPCList.push(obj.sourceName);
                    }
                    enemyNPCCount++;
                } else if (sourceFlag === "neutralNPC") {
                    if (!affiliationTestData.neutralNPCList.includes(obj.sourceName)) {
                        affiliationTestData.neutralNPCList.push(obj.sourceName);
                    }
                    neutralNPCCount++;
                } else if (sourceFlag === "unknown") {
                    if (!affiliationTestData.unknownNPCList.includes(obj.sourceName)) {
                        affiliationTestData.unknownNPCList.push(obj.sourceName);
                    }
                    unknownNPCCount++;
                } else if (sourceFlag === "none") {
                    if (!affiliationTestData.noneList.includes(obj.sourceName)) {
                        affiliationTestData.noneList.push(obj.sourceName);
                    }
                    noneCount++;
                } else {
                        console.log(`Source name ${obj.sourceName} had an error with flag:`);
                        console.log(sourceFlag);
                    }

                if (destFlag === "player") {
                    if (!affiliationTestData.playerList.includes(obj.destName)) {
                        affiliationTestData.playerList.push(obj.destName);
                    }
                    playerCount++;
                } else if (destFlag === "pet") {
                    if (!affiliationTestData.petList.includes(obj.destName)) {
                        affiliationTestData.petList.push(obj.destName);
                    }
                    petCount++;
                } else if (destFlag === "friendlyNPC") {
                    if (!affiliationTestData.friendlyNPCList.includes(obj.destName)) {
                        affiliationTestData.friendlyNPCList.push(obj.destName);
                    }
                    friendlyNPCCount++;
                } else if (destFlag === "enemyPlayer") {
                    if (!affiliationTestData.enemyPlayerList.includes(obj.destName)) {
                        affiliationTestData.enemyPlayerList.push(obj.destName);
                    }
                    enemyPlayerCount++;
                } else if (destFlag === "friendlyPlayer") {
                    if (!affiliationTestData.friendlyPlayerList.includes(obj.destName)) {
                        affiliationTestData.friendlyPlayerList.push(obj.destName);
                    }
                    friendlyPlayerCount++;
                } else if (destFlag === "enemyNPC") {
                    if (!affiliationTestData.enemyNPCList.includes(obj.destName)) {
                        affiliationTestData.enemyNPCList.push(obj.destName);
                    }
                    enemyNPCCount++;
                } else if (destFlag === "neutralNPC") {
                    if (!affiliationTestData.neutralNPCList.includes(obj.destName)) {
                        affiliationTestData.neutralNPCList.push(obj.destName);
                    }
                    neutralNPCCount++;
                } else if (destFlag === "unknown") {
                    if (!affiliationTestData.unknownNPCList.includes(obj.destName)) {
                        affiliationTestData.unknownNPCList.push(obj.destName);
                    }
                    unknownNPCCount++;
                } else if (destFlag === "none") {
                    if (!affiliationTestData.noneList.includes(obj.sourceName)) {
                        affiliationTestData.noneList.push(obj.sourceName);
                    }
                    noneCount++;
                } else {
                    console.log(`Dest name ${obj.destName} had an error with flag:`);
                    console.log(destFlag);
                }
            }











            //SESSION HANDLING
            function handleSession(){
                if (!sessionActive && ["DAMAGE", "MISSED"].includes(parsedObject.event[1])) {
                    previousDamageParseTimeStamp = parsedObject.timeStamp
                    startSession();
                }

                if (sessionActive) {
                    if (parsedObject.event[1] === "DAMAGE" || parsedObject.event[1] === "MISSED") {
                        previousDamageLineCount = linesCount;
                        
                    }
                    if (previousDamageParseTimeStamp < (parsedObject.timeStamp - (inputDamageTimeout * 1000))) {
                        endSession(true);
                        removeOverdueSessionInteractions(); 
                    }
                    if ((currentSessionData.bossName === "None") && BOSSNAMES.includes(parsedObject.sourceName) && parsedObject.sourceFlag === "enemyNPC") {
                        currentSessionData.bossName = parsedObject.sourceName;
                    }
                    if ((currentSessionData.bossName === "None") && BOSSNAMES.includes(parsedObject.destName) && parsedObject.destFlag === "enemyNPC") {
                        currentSessionData.bossName = parsedObject.destName;
                    }
                    if (parsedObject.event[1] === "DAMAGE" || parsedObject.event[1] === "MISSED") {
                        previousDamageParseTimeStamp = parsedObject.timeStamp;
                    }
                    handleCurrentSessionData();
                    if ((parsedObject.destName === currentSessionData.bossName) && (parsedObject.event[1] === "UNITDIED")) {
                        console.log("Boss defeated, ending session");
                        currentSessionData.outcome = "Victory";
                        console.log("Boss defeated, ending session");
                        endSession();
                    }
                    

                }

            }

            function startSession() {
                const timestamp = new Date(parsedObject.timeStamp);
                sessionActive = true;
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                currentSessionData.startParse = parsedObject;
                currentSessionData.day = dayNames[timestamp.getDay()];
                currentSessionData.month = monthNames[timestamp.getMonth()];
                currentSessionData.year = timestamp.getFullYear();
                currentSessionData.startHour = timestamp.getHours();
                currentSessionData.startMinute = timestamp.getMinutes();
                currentSessionData.startSecond = timestamp.getSeconds();
                currentSessionData.startMillisecond = timestamp.getMilliseconds();
                currentSessionData.startTime = parsedObject.timeStamp;
                currentSessionData.dataIndexStart = linesCount;
            }

            function handleCurrentSessionData() {
                if (parsedObject.sourceName === "Shard of Gonk" || parsedObject.destName === "Shard of Gonk") { return }
                let sourceProcessType = checkProcessType(parsedObject.sourceFlag);
                let destProcessType = checkProcessType(parsedObject.destFlag);
                if (sourceProcessType === "ByID" && MultipleIdMonsters.includes(parsedObject.sourceName)) { sourceProcessType = "ByName" }
                if (destProcessType === "ByID" && MultipleIdMonsters.includes(parsedObject.destName)) { destProcessType = "ByName" }

                // Handle source entity (dealt)
                const sourceList = currentSessionData.entitiesData?.[`${parsedObject.sourceFlag}s`];
                if (sourceList) {
                    let sourceEntity;
                    if (sourceProcessType === "ByID") {
                        sourceEntity = sourceList.find(entity => entity.GUID === parsedObject.sourceGUID);
                        if (!sourceEntity) {
                            sourceEntity = {
                                name: parsedObject.sourceName,
                                GUID: parsedObject.sourceGUID,
                                type: parsedObject.sourceFlag,
                                linesCount: linesCount,
                                interactions: { received: [], dealt: [] }
                            };
                            sourceList.push(sourceEntity);
                        }
                    } else {
                        sourceEntity = sourceList.find(entity => entity.name === parsedObject.sourceName);
                        if (!sourceEntity) {
                            sourceEntity = {
                                name: parsedObject.sourceName,
                                GUID: parsedObject.sourceGUID,
                                type: parsedObject.sourceFlag,
                                linesCount: linesCount,
                                interactions: { received: [], dealt: [] }
                            };
                            sourceList.push(sourceEntity);
                        }
                    }
                    // Add dealt interaction
                    if (parsedObject.spellName && !sourceEntity.interactions.dealt.some(interaction => interaction.name === parsedObject.spellName)) {
                        sourceEntity.interactions.dealt.push({
                            name: parsedObject.spellName,
                            spellID: parsedObject.spellId,
                            spellSchool: parsedObject.spellSchool,
                            auraType: parsedObject.auraType || null,
                            discoveredAtLine: linesCount,
                        });
                    }
                }

                // Handle destination entity (received)
                const destList = currentSessionData.entitiesData?.[`${parsedObject.destFlag}s`];
                if (destList) {
                    let destEntity;
                    if (destProcessType === "ByID") {
                        destEntity = destList.find(entity => entity.GUID === parsedObject.destGUID);
                        if (!destEntity) {
                            destEntity = {
                                name: parsedObject.destName,
                                GUID: parsedObject.destGUID,
                                type: parsedObject.destFlag,
                                linesCount: linesCount,
                                interactions: { received: [], dealt: [] }
                            };
                            destList.push(destEntity);
                        }
                    } else {
                        destEntity = destList.find(entity => entity.name === parsedObject.destName);
                        if (!destEntity) {
                            destEntity = {
                                name: parsedObject.destName,
                                GUID: parsedObject.destGUID,
                                type: parsedObject.destFlag,
                                linesCount: linesCount,
                                interactions: { received: [], dealt: [] }
                            };
                            destList.push(destEntity);
                        }
                    }
                    // Add received interaction
                    if (parsedObject.spellName && !destEntity.interactions.received.some(interaction => interaction.name === parsedObject.spellName)) {
                        destEntity.interactions.received.push({
                            name: parsedObject.spellName,
                            spellID: parsedObject.spellId,
                            spellSchool: parsedObject.spellSchool,
                            auraType: parsedObject.auraType || null,
                            discoveredAtLine: linesCount,
                        });
                    }
                }
            }
            
            function removeOverdueSessionInteractions() {
                const allEntityFlags = Object.keys(currentSessionData.entitiesData);
                currentSessionData.dataIndexEnd = previousDamageLineCount;
                allEntityFlags.forEach(flag => {
                    let entityList = currentSessionData.entitiesData[flag];
                    if (!entityList) return;
                    // First, filter interactions to only those within session bounds
                    entityList.forEach(entity => {
                        if (entity.interactions) {
                            entity.interactions.received = entity.interactions.received.filter(
                                interaction => interaction?.discoveredAtLine >= currentSessionData.dataIndexStart &&
                                               interaction?.discoveredAtLine <= currentSessionData.dataIndexEnd
                            );
                            entity.interactions.dealt = entity.interactions.dealt.filter(
                                interaction => interaction?.discoveredAtLine >= currentSessionData.dataIndexStart &&
                                               interaction?.discoveredAtLine <= currentSessionData.dataIndexEnd
                            );
                        }
                    });
                    // Then, remove entities with empty interactions
                    currentSessionData.entitiesData[flag] = entityList.filter(entity => {
                        const received = entity.interactions?.received || [];
                        const dealt = entity.interactions?.dealt || [];
                        return received.length > 0 || dealt.length > 0;
                    });
                });
            }


            function checkProcessType(entity){
                if (["player", "pet", "enemyPlayer", "friendlyPlayer"].includes(entity)){
                    return "ByName"
                } else if (["friendlyNPC", "neutralNPC", "enemyNPC", "unknown"].includes(entity)){
                    return "ByID"
                } else {
                    return "none";
                }

            }

            function endSession(isTimeout = false) {
                console.log(parsedObject)
                const timestamp = new Date(parsedObject.timeStamp);
                sessionActive = false;
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                if (currentSessionData.bossName === "None") { currentSessionData.bossName = "Trash" }
                currentSessionData.endParse = parsedObject;
                currentSessionData.day = [timestamp.getDay(), dayNames[timestamp.getDay()]];
                currentSessionData.month = [timestamp.getMonth(), monthNames[timestamp.getMonth()]];
                currentSessionData.year = timestamp.getFullYear();
                currentSessionData.endTime = parsedObject.timeStamp;
                currentSessionData.endHour = timestamp.getHours();
                currentSessionData.endMinute = timestamp.getMinutes();
                currentSessionData.endSecond = timestamp.getSeconds();
                currentSessionData.endMillisecond = timestamp.getMilliseconds();
                currentSessionData.encounterLength = (parsedObject.timeStamp - currentSessionData.startTime) / 1000;
                currentSessionData.dataIndexEnd = isTimeout ? previousDamageLineCount : linesCount;
                metaData.sessions.push(currentSessionData);
                setSessionCount(count => count + 1);
                resetSession();
            }

            function resetSession(){
                currentSessionData = {
                    day: "Error",
                    month: "Error",
                    year: "Error",
                    startTime: 0,
                    startHour: 0,
                    startMinute: 0,
                    startSecond: 0,
                    startMillisecond: 0,
                    endTime: 0,
                    endHour: 0,
                    endMinute: 0,
                    endSecond: 0,
                    endMillisecond: 0,
                    encounterLength: 0,
                    dataIndexStart: 0,
                    dataIndexEnd: 0,
                    bossName: "None",
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
                        unknownNPCs: []
                    }
                };
            }
    
        readNextChunk();

    }


    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, inputYear, setInputYear, setInputDamageTimeout }}>
            {children}
        </DataContext.Provider>
    );

    
}

