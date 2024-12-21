import React, { createContext, useState } from 'react';
import { parseString, damageEventCheck } from '../helpers/parseHelpers.js';
import { BOSSNAMES, MultipleIdMonsters } from '../helpers/constants.js';

// Create the context
export const DataContext = createContext();

const CHUNK_SIZE = 50 * 1024;

// Create a provider component
export const DataContextProvider = ({ children }) => {
    const [progress, setProgress] = useState('Ready for use');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [data, setData] = useState([]);
    const [sessions , setSessions] = useState([]);
    const [sessionLines, setSessionLines] = useState([]);
    const [sessionCount, setSessionCount] = useState(0);
    const [sessionType, setSessionType] = useState("Default");
    //Data of valid and invalid lines

    function readNewFile(file) {
        
        const reader = new FileReader();
        let offset = 0;
        let carryOver = '';
        let dataTemp = [];
        let SourceListTemp = [];
        let validLineCount = 0;


        let lineCounter = 0;
        let lineCounterSessionStart = 0;

        let startDate;
        let previousTimeStamp = 0;
        let previousDamageTimeStamp = 0;
        let previousDamageWithin30Seconds = 0;

        let currentSessionStart = 0;
        let currentSessionBOSS = "Trash";
        let currentDate;
        let sessionData = [];
        let sessionsCount = 0;
        let sessionStartDate = 0;

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
        let testEventList = [];
        let testDataList = [];


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
            setProgress(`Read ${Math.min(offset, file.size)} of ${file.size} bytes`);
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
                setData(dataTemp);
                sessionData.push({
                    session: currentSessionBOSS,
                    timeStart: currentSessionStart,
                    timeEnd: previousTimeStamp,
                    lines: lineCounter - lineCounterSessionStart,
                    lineStart: lineCounterSessionStart,
                    lineEnd: lineCounter,
                    duration: (previousTimeStamp - currentSessionStart) / 1000,
                });
                console.log("Recorded events:")
                console.log(testEventList);
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
            }
                
        }

            const readNextChunk = () => {
                const blob = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(blob);
            };

            //Handles the parsing of the line
        function handleParse(currentLine){

            let parsedLine;

            //Check if the line is valid and push it to the data array
            if (parseString(currentLine)){

                parsedLine = parseString(currentLine);
                dataTemp.push(parsedLine);
                setValidLinesCount(prevCount => prevCount + 1);
                checkIfNewSession();
                testEventsToList(parsedLine.event);
            }else {

                setInvalidLinesCount(prevCount => prevCount + 1);
                dataTemp.push(parsedLine);
                return false;

            }

            function testEventsToList(event){

                if (parsedLine?.event){

                    if(!testEventList.includes(parsedLine.event.join("_"))){
                        testEventList.push(parsedLine.event.join("_"));
                        testDataList.push(parsedLine);
                    }

                }

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
                
                const processTypeSource = selectProcessType(parsedLine.sourceFlags, parsedLine.sourceName);
                const processTypeDest = selectProcessType(parsedLine.destFlags, parsedLine.destName);

                
                /*console.log("TypeSource: " + processTypeSource);
                console.log("TypeDest: " + processTypeDest);*/

                const processTypeMapping = {
                    Player: { list: playerList, allowMultipleIds: true },
                    Pet: { list: petList, allowMultipleIds: true },
                    FriendlyNPC: { list: friendlyNPCList, allowMultipleIds: false },
                    HostileNPC: { list: hostileNPCList, allowMultipleIds: false },
                    MultipleIdFriendlyNPC: { list: friendlyNPCList, allowMultipleIds: true },
                    MultipleIdHostileNPC: { list: hostileNPCList, allowMultipleIds: true },
                    NeutralEntity: { list: unknownNPCList, allowMultipleIds: false },
                    UnknownEntity: { list: unknownNPCList, allowMultipleIds: false }
                };

                [
                    { 
                        type: processTypeSource, 
                        obj: {
                            name: parsedLine.sourceName, 
                            GUID: parsedLine.sourceGUID,
                            actionName: parsedLine.spellName !== undefined ? parsedLine.spellName : false,
                            actionId: parsedLine.spellId !== undefined ? parsedLine.spellId : 0, 
                            flags: parsedLine.sourceFlags,
                            sourceActionList: sourceActionList,
                        } 
                    },
                    { 
                        type: processTypeDest, 
                        obj: {
                            name: parsedLine.destName, 
                            GUID: parsedLine.destGUID, 
                            flags: parsedLine.destFlags, 
                            actionName: parsedLine.spellName !== undefined ? parsedLine.spellName : false, 
                            actionId: parsedLine.spellId !== undefined ? parsedLine.spellId : 0, 
                            actionList: destActionList,
                        } 
                    }
                ].forEach(({ type, obj }) => {
                    const mapping = processTypeMapping[type];
                    if (mapping) {
                        checkUniqueEntryInLists(obj, mapping.list, mapping.allowMultipleIds, obj.actionList);
                    }
                });

            }
            
            function checkUniqueEntryInLists(obj, selectedEntityList, allowMultipleIds, selectedActionlist) {
                // Find the source entry by name
                let sourceEntry = selectedEntityList.find(entry => entry.name === obj.name);
                
                // If no entry exists, create one
                if (sourceEntry === undefined) {
                    sourceEntry = { name: obj.name, guid: [obj.GUID], flags: obj.flags, actions: [] };
                    selectedEntityList.push(sourceEntry);
                } else if (allowMultipleIds && !sourceEntry.guid.includes(obj.GUID)) {
                    // If multiple IDs are allowed and GUID isn't already in the list, add it
                    sourceEntry.guid.push(obj.GUID);
                }
            
                // Handle actions (e.g., actionName and actionId)
                if (obj.actionName) {
                    let actionEntry = sourceEntry.selectedActionlist.find(selectedActionlist => selectedActionlist.id === obj.actionId);
                    if (actionEntry === undefined) {
                        actionEntry = { name: obj.actionName, id: obj.actionId };
                        sourceEntry.selectedActionlist.push(actionEntry);
                    }
                }
            }

            function selectProcessType(flags, name) { //yes
                if (["MINE", "RAID", "PARTY"].includes(flags.affiliation) && flags.reaction === "FRIENDLY" && flags.control !== "PLAYER") {
                    return "Player";
                } else if (["MINE", "RAID", "PARTY"].includes(flags.affiliation) && flags.reaction === "FRIENDLY" && flags.control === "PLAYER") {
                    return "Pet";
                } else if (["OUTSIDER", "MASK"].includes(flags.affiliation) && flags.reaction === "FRIENDLY") {
                    return name === MultipleIdMonsters ? "MultipleIdFriendlyNPC" : "FriendlyEntity";
                } else if (["OUTSIDER", "MASK"].includes(flags.affiliation) && flags.reaction === "HOSTILE") {
                    return name === MultipleIdMonsters ? "MultipleIdHostileNPC" : "HostileEntity";
                } else if (["OUTSIDER", "MASK"].includes(flags.affiliation) && flags.reaction === "NEUTRAL") {
                    return "NeutralEntity";
                } else if (flags.affiliation === "0") {
                    return "UnknownEntity";
                }
            }

















            function checkIfNewSession(){
                /* console.log("Checking if new session")
                console.log(parsedLine.isDamage)
                console.log(parsedLine.timeMs)
                console.log(lineCounter) */

                handleNameAndGUID();
                
                if(parsedLine.isDamage){

                    if (BOSSNAMES.includes(parsedLine.sourceName) && !currentSessionBOSS){
                        currentSessionBOSS = parsedLine.sourceName;
                    }

                    if (previousTimeStamp === 0){
                    
                        previousTimeStamp = parsedLine.timeMs;
                        currentSessionStart = parsedLine.timeMs;
                        lineCounterSessionStart = lineCounter;
                        previousDate = parsedLine.date;
                    
                        dataTemp.push(parsedLine);
                    
                    } else if ((parsedLine.timeMs > previousTimeStamp + 60000) || (parsedLine.destName === currentSessionBOSS && parsedLine.isUnitDead)) {
                    
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
                        
                        dataTemp.push(parsedLine);
                        sessionsCount ++;
                        currentSessionBOSS = false;
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
                    
                    } else {
                        if (previousDate !== parsedLine.date){
                        previousTimeStamp = parsedLine.timeMs;
                        dataTemp.push(parsedLine);
                        } else {

                    }
                    
                }
                lineCounter ++;
                

                
            }
        }
        readNextChunk();
    }
    
    
   

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, sessionType, setSessionType }}>
            {children}
        </DataContext.Provider>
    );

    
}