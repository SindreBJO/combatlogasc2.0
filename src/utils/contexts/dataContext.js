import React, { createContext, useEffect, useState } from 'react';
import { parseString, damageEventCheck, setGlobalYear } from '../helpers/parseHelpers.js';
import { BOSSNAMES, MultipleIdMonsters } from '../helpers/constants.js';

export const DataContext = createContext();

const CHUNK_SIZE = 50 * 1024;

export const DataContextProvider = ({ children }) => {
    const [progress, setProgress] = useState('Ready for use');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [data, setData] = useState([]);
    const [sessions , setSessions] = useState([]);
    const [sessionLines, setSessionLines] = useState([]);
    const [sessionCount, setSessionCount] = useState(0);
    const [inputYear, setInputYear] = useState();

    useEffect(() => {
        setGlobalYear(inputYear || new Date().getFullYear())
    }, [inputYear],[]);
    
    const reader = new FileReader();
    let offset = 0;
    let carryOver = '';

    let lineCounter = 0;
    let lineCounterSessionStart = 0;

    let startDate;
    let previousDate = 0;
    let previousTimeStamp = 0;
    let previousDamageTimeStamp = 0;


    let currentSessionStart = 0;
    let currentSessionBOSS = "Trash";
    let currentDate;
    let sessionData = [];
    let sessionsCount = 0;
    let sessionStartDate = 0;

    let uniqueSubEventList = [];

    let playerList = [];
    let petList = [];
    let playerControledNPCList = [];
    let friendlyNPCList = [];
    let neutralNPCList = [];
    let MultipleIdFriendlyNPCList = [];
    let hostileNPCList = [];
    let MultipleIdHostileNPCList = [];
    let unknownNPCList = [];

    let sourceFlagTest = [];
    let sourceFlagTestLines = [];

    let testSchoolList = [];

    let testDataList = [];
    let testDataRaw = [];

    let metaData = [];
    let invalidData = [];

    function readNewFile(file) {
        
        setData([]);
        setValidLinesCount(0);
        setInvalidLinesCount(0);
        setProgress('Loadingstate');
        setProgressPercentage(0);
        setSessionCount(0);
        setSessionLines([]);
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
                handleParse(carryOver);
                //Finished reading the file and parse the data
                setProgress('File reading completed.');
                setProgressPercentage(100);
                setSessions(sessionLines);
                setData(metaData);
                sessionData.push({
                    sessionBoss: currentSessionBOSS,
                    timeStart: currentSessionStart,
                    timeEnd: previousTimeStamp,
                    lines: lineCounter - lineCounterSessionStart,
                    lineStart: lineCounterSessionStart,
                    lineEnd: lineCounter,
                    duration: (previousTimeStamp - currentSessionStart) / 1000,
                });
                console.log("Recorded data:")
                console.log(testDataList);
                console.log("Session data:")
                console.log(sessionData);
                console.log("Player list:")
                console.log(playerList);
                console.log("Friendly NPC list:")
                console.log(friendlyNPCList);
                console.log("Hostile NPC list:")
                console.log(hostileNPCList);
                console.log("Unique Event List:")
                console.log(testDataRaw);
                console.log("test data list:")
                console.log(metaData);
                console.log("Invalid data:")
                console.log(invalidData);
                console.log("pet data;")
                console.log(petList);
            }
                
        }

            const readNextChunk = () => {
                const blob = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(blob);
            };

            //Handles the parsing of the line
        function handleParse(currentLine){

            let parsedLine = parseString(currentLine);
            if (!parsedLine) {
                if (currentLine === "" || currentLine === "\r") { return } // Skips all empty lines
                setInvalidLinesCount(prevCount => prevCount + 1);
                invalidData.push(currentLine.replace(/\r/g, ''));
                return false;
            }
                parsedLine = parseString(currentLine);
                metaData.push(parsedLine);
                setValidLinesCount(prevCount => prevCount + 1);
                checkIfNewSession();
                checkUniqueEvent(parsedLine.event);
    
                


            function checkUniqueEvent(event){

                    if(!testDataList.includes(parsedLine.event.join("_"))){
                        testDataList.push(parsedLine.event.join("_"));
                        testDataRaw.push(currentLine);
                    }
            }

            function handleSession(){
                if (previousTimeStamp === 0 && parsedLine.isDamage) {

                    previousTimeStamp = parsedLine.timeMs;
                    currentSessionStart = parsedLine.timeMs;
                    lineCounterSessionStart = lineCounter;
                    previousDate = parsedLine.date;

                }
            }

            function startSession(){

            }

            function endSession(){

            }

            function handleCombatRosterAndSignature(){

            }

            function checkAffiliationAndReaction(){

            }





            function handleNameAndGUID() {

                /*console.log("--------------------")
                console.log("Handling Name and GUID")
                console.log("sname: " + parsedLine.sourceName);
                console.log("sid: " + parsedLine.sourceGUID);
                console.log("dname: " + parsedLine.destName);
                console.log("did: " + parsedLine.destGUID);
                console.log("sflag:");
                console.log(parsedLine.sourceFlags);
                console.log("dflag:");
                console.log(parsedLine.destFlags);*/



                if (!parsedLine) { 
                    console.error("-----Error: parsedLine is undefined."); 
                    return; 
                }
                if (!parsedLine.sourceFlags) { 
                    console.error("-----Error: parsedLine.sourceFlags is undefined."); 
                    return; 
                }
                if (!parsedLine.sourceGUID) { 
                    console.error("-----Error: parsedLine.sourceGUID is undefined."); 
                    return; 
                }
                if (!parsedLine.sourceName) { 
                    console.error("-----Error: parsedLine.sourceFlags.sourceName is undefined."); 
                    return; 
                }
                if (!parsedLine.destName) { 
                    console.error("-----Error: parsedLine.destName is undefined."); 
                    return; 
                }
                if (!parsedLine.destGUID) { 
                    console.error("-----Error: parsedLine.destGUID is undefined."); 
                    return; 
                }
                if (!parsedLine.sourceFlags) { 
                    console.error("-----Error: parsedLine.destFlags is undefined."); 
                    return; 
                }
                
                const processTypeSource = 0;
                const processTypeDest = 0
                ;

                
                /*console.log("TypeSource: " + processTypeSource); 
                console.log("TypeDest: " + processTypeDest);*/ 

                // FORMAT: Type, {list, bool for multipleIDs} 
                const processTypeMapping = { 
                    Player: { list: playerList, allowMultipleIds: true }, 
                    Pet: { list: petList, allowMultipleIds: true }, 
                    FriendlyNPC: { list: friendlyNPCList, allowMultipleIds: false }, 
                    HostileNPC: { list: hostileNPCList, allowMultipleIds: false }, 
                    MultipleIdFriendlyNPC: { list: friendlyNPCList, allowMultipleIds: true }, 
                    MultipleIdHostileNPC: { list: hostileNPCList, allowMultipleIds: true }, 
                    NeutralNPC: { list: neutralNPCList, allowMultipleIds: false }, 
                    UnknownNPC: { list: unknownNPCList, allowMultipleIds: false } 
                }; 

                [
                    { 
                        type: processTypeSource, 
                        obj: {
                            name: parsedLine.sourceName, 
                            GUID: parsedLine.sourceGUID,
                            actionName: parsedLine.spellName,
                            actionId: parsedLine.spellId, 
                            flags: parsedLine.sourceFlags,
                            type: "source",
                        } 
                    },
                    { 
                        type: processTypeDest, 
                        obj: { 
                            name: parsedLine.destName, 
                            GUID: parsedLine.destGUID, 
                            flags: parsedLine.destFlags, 
                            actionName: parsedLine.spellName, 
                            actionId: parsedLine.spellId, 
                            type: "dest", 
                        } 
                    } 
                    
                ].forEach(({ type, obj }) => { 
                    const mapping = processTypeMapping[type];
                    if (mapping) { 
                        checkUniqueEntryInLists(obj, mapping.list, mapping.allowMultipleIds); 
                    } 
                }); 

            } 

            function checkUniqueEntryInLists(obj, selectedEntityList, allowMultipleIds) { 
                let sourceEntry = selectedEntityList.find(entry => entry.name === obj.name);

                if (sourceEntry === undefined) {
                    sourceEntry = { name: obj.name, guid: [obj.GUID], flags: obj.flags, sourceActions: [], destActions: [] };
                    selectedEntityList.push(sourceEntry);
                } else if (allowMultipleIds && !sourceEntry.guid.includes(obj.GUID)) {
                    sourceEntry.guid.push(obj.GUID);
                }

                if (obj.type === "source") {
                    let actionEntry = sourceEntry.sourceActions.find(action => action.id === obj.actionId);
                    
                    if (actionEntry === undefined) {
                        sourceEntry.sourceActions.push({ name: obj.actionName, id: obj.actionId });
                    }

                } else if (obj.type === "dest") {
                    let actionEntry = sourceEntry.destActions.find(action => action.id === obj.actionId);
                    
                    if (actionEntry === undefined) {
                        actionEntry = { name: obj.actionName, id: obj.actionId };
                        sourceEntry.destActions.push(actionEntry);
                    }
                }
            }



















            function checkIfNewSession(){
                /* console.log("Checking if new session")
                console.log(parsedLine.isDamage)
                console.log(parsedLine.timeMs)
                console.log(lineCounter) */

                if(parsedLine.isDamage){

                    if (BOSSNAMES.includes(parsedLine.sourceName) && currentSessionBOSS === "Trash"){
                        currentSessionBOSS = parsedLine.sourceName;
                    }

                    if (previousTimeStamp === 0){
                    
                        previousTimeStamp = parsedLine.timeMs;
                        currentSessionStart = parsedLine.timeMs;
                        lineCounterSessionStart = lineCounter;
                        previousDate = parsedLine.date;

                    } else if ((parsedLine.timeMs > previousTimeStamp + 60000) || (parsedLine.destName === currentSessionBOSS && parsedLine.isDead)) {
                    
                        sessionData.push({
                            sessionBoss: currentSessionBOSS,
                            timeStart: currentSessionStart,
                            timeEnd: previousTimeStamp,
                            lines: lineCounter - lineCounterSessionStart,
                            lineStart: lineCounterSessionStart,
                            lineEnd: lineCounter,
                            duration: (previousTimeStamp - currentSessionStart) / 1000,
                            players: playerList,
                            pets: petList,
                            playerControledNPCs: playerControledNPCList,
                            neutralNPCs: neutralNPCList,
                            friendlyNPCs: [...MultipleIdFriendlyNPCList, ...friendlyNPCList],
                            hostileNPCs: [...MultipleIdHostileNPCList, ...hostileNPCList],
                            unknownNPCs: unknownNPCList,

                        });
                        

                        sessionsCount ++;
                        currentSessionBOSS = "Trash";
                        previousTimeStamp = 0;
                        currentSessionStart = 0;
                        playerList = [];
                        petList = [];
                        playerControledNPCList = [];
                        friendlyNPCList = [];
                        neutralNPCList = [];
                        MultipleIdFriendlyNPCList = [];
                        hostileNPCList = [];
                        MultipleIdHostileNPCList = [];
                        unknownNPCList = [];
                    
                    } else if (previousDate !== parsedLine.date){
                        previousTimeStamp = parsedLine.timeMs;

                        } else {
                            console.log("Error: Session reading, in checkIfNewSession()")
                    }
                    
                
                lineCounter ++;
                

                
            }
        }
    }
        readNextChunk();
    }

    
   

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, inputYear, setInputYear }}>
            {children}
        </DataContext.Provider>
    );

    
}

