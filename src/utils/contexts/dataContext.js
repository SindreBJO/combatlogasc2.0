import React, { createContext, useEffect, useState } from 'react';
import { parseString, damageEventCheck, setGlobalYear, testArrayLength } from '../helpers/parseHelpers.js';
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
    const [sessionCount, setSessionCount] = useState(0);
    const [inputYear, setInputYear] = useState();

    useEffect(() => {
        setGlobalYear(inputYear || new Date().getFullYear())
    }, [inputYear],[]);
    
    const reader = new FileReader();
    let offset = 0;
    let carryOver = '';






    //Session variables
    let currentSessionData = [];
    let currentSessionIndexStart = 0;
    let currentSessionBossName = "None";
    let currentSessionStartTime = 0;
    let currentSessionEndTime = 0;
    let previousParseTimeStamp = 0;
    let currentSessionOutcome = "Unknown";


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

    let playerCount = 0;
    let petCount = 0;
    let enemyPlayerCount = 0;
    let friendlyPlayerCount = 0;
    let friendlyNPCCount = 0;
    let neutralNPCCount = 0;
    let enemyNPCCount = 0;
    let unknownNPCCount = 0;
    let noneCount = 0;

    let metaData = [];
    let invalidData = [];

    let tempTestDataList = [];

    let linesCount = 0;

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
                handleParse(carryOver);
                
                //Finished reading the file and parse the data

                setProgress('File reading completed.');
                setProgressPercentage(100);
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

            }
                
        }

            const readNextChunk = () => {
                const blob = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(blob);
            };

            //Handles the parsing of the line
        function handleParse(unparsedLine){

            let parsedObject = parseString(unparsedLine);
            if (parsedObject) {
                lengthTest(parsedObject, unparsedLine);
                affiliationTest(parsedObject)
                setValidLinesCount(prevCount => prevCount + 1);
                metaData.push(parsedObject);
            }
            if (unparsedLine === "" || unparsedLine === "\r") { return } // Skips all empty lines
            if (parsedObject === false) {
                setInvalidLinesCount(prevCount => prevCount + 1);
                invalidData.push(unparsedLine.replace(/\r/g, ''));
            return;
            }
            linesCount++;
            parsedObject = null;
            unparsedLine = null;
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

                if (sourceFlag === "Player") {
                    if (!affiliationTestData.playerList.includes(obj.sourceName)) {
                        affiliationTestData.playerList.push(obj.sourceName);
                    }
                    playerCount++;
                } else if (sourceFlag === "Pet") {
                    if (!affiliationTestData.petList.includes(obj.sourceName)) {
                        affiliationTestData.petList.push(obj.sourceName);
                    }
                    petCount++;
                } else if (sourceFlag === "FriendlyNPC") {
                    if (!affiliationTestData.friendlyNPCList.includes(obj.sourceName)) {
                        affiliationTestData.friendlyNPCList.push(obj.sourceName);
                    }
                    friendlyNPCCount++;
                } else if (sourceFlag === "EnemyPlayer") {
                    if (!affiliationTestData.enemyPlayerList.includes(obj.sourceName)) {
                        affiliationTestData.enemyPlayerList.push(obj.sourceName);
                    }
                    enemyPlayerCount++;
                } else if (sourceFlag === "FriendlyPlayer") {
                    if (!affiliationTestData.friendlyPlayerList.includes(obj.sourceName)) {
                        affiliationTestData.friendlyPlayerList.push(obj.sourceName);
                    }
                    friendlyPlayerCount++;
                } else if (sourceFlag === "EnemyNPC") {
                    if (!affiliationTestData.enemyNPCList.includes(obj.sourceName)) {
                        affiliationTestData.enemyNPCList.push(obj.sourceName);
                    }
                    enemyNPCCount++;
                } else if (sourceFlag === "NeutralNPC") {
                    if (!affiliationTestData.neutralNPCList.includes(obj.sourceName)) {
                        affiliationTestData.neutralNPCList.push(obj.sourceName);
                    }
                    neutralNPCCount++;
                } else if (sourceFlag === "Unknown") {
                    if (!affiliationTestData.unknownNPCList.includes(obj.sourceName)) {
                        affiliationTestData.unknownNPCList.push(obj.sourceName);
                    }
                    unknownNPCCount++;
                } else if (sourceFlag === "None") {
                    if (!affiliationTestData.noneList.includes(obj.sourceName)) {
                        affiliationTestData.noneList.push(obj.sourceName);
                    }
                    noneCount++;
                } else {
                        console.log(`Source name ${obj.sourceName}.`);
                        console.log(sourceFlag);
                    }

                if (destFlag === "Player") {
                    if (!affiliationTestData.playerList.includes(obj.destName)) {
                        affiliationTestData.playerList.push(obj.destName);
                    }
                    playerCount++;
                } else if (destFlag === "Pet") {
                    if (!affiliationTestData.petList.includes(obj.destName)) {
                        affiliationTestData.petList.push(obj.destName);
                    }
                    petCount++;
                } else if (destFlag === "FriendlyNPC") {
                    if (!affiliationTestData.friendlyNPCList.includes(obj.destName)) {
                        affiliationTestData.friendlyNPCList.push(obj.destName);
                    }
                    friendlyNPCCount++;
                } else if (destFlag === "EnemyPlayer") {
                    if (!affiliationTestData.enemyPlayerList.includes(obj.destName)) {
                        affiliationTestData.enemyPlayerList.push(obj.destName);
                    }
                    enemyPlayerCount++;
                } else if (destFlag === "FriendlyPlayer") {
                    if (!affiliationTestData.friendlyPlayerList.includes(obj.destName)) {
                        affiliationTestData.friendlyPlayerList.push(obj.destName);
                    }
                    friendlyPlayerCount++;
                } else if (destFlag === "EnemyNPC") {
                    if (!affiliationTestData.enemyNPCList.includes(obj.destName)) {
                        affiliationTestData.enemyNPCList.push(obj.destName);
                    }
                    enemyNPCCount++;
                } else if (destFlag === "NeutralNPC") {
                    if (!affiliationTestData.neutralNPCList.includes(obj.destName)) {
                        affiliationTestData.neutralNPCList.push(obj.destName);
                    }
                    neutralNPCCount++;
                } else if (destFlag === "Unknown") {
                    if (!affiliationTestData.unknownNPCList.includes(obj.destName)) {
                        affiliationTestData.unknownNPCList.push(obj.destName);
                    }
                    unknownNPCCount++;
                } else if (destFlag === "None") {
                    if (!affiliationTestData.noneList.includes(obj.sourceName)) {
                        affiliationTestData.noneList.push(obj.sourceName);
                    }
                    noneCount++;
                } else {
                    console.log(`Dest name ${obj.destName}.`);
                    console.log(destFlag);
                }
            }

            function handleSession(){
                if (1){

                }
            }

            function startSession(){

            }

            function endSession(){

            }

            function handleCombatRosterAndSignature(){

            }

            function handleNameAndGUID() {

        }
    
        readNextChunk();

    }

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, inputYear, setInputYear }}>
            {children}
        </DataContext.Provider>
    );

    
}

