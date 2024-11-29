import React, { createContext, useState } from 'react';
import { validateString, stringToArray, stringDamageEventCheck, splitDate, timeStampMs, stringToObject,flagStringToFlagObject } from '../helpers/parseHelpers.js';
import {BOSSNAMES} from '../helpers/constants.js';

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
    //Data of valid and invalid lines

    function readNewFile(file) {
        
        const reader = new FileReader();
        let offset = 0;
        let carryOver = '';
        let dataTemp = [];
        let SourceListTemp = [];
        let validLineCount = 0;
        let currentSessionStart = 0;
        let currentSessionBOSS = false;
        let sessionData = [];

        let lineCounter = 0;
        let lineCounterSessionStart = 0;

        let previousTimeStamp = 0;
        let sessionsCount = 0;
        let allUnits = [];
        let playerUnits = [];
        let hostileUnits = [];
        let friendlyUnits = [];

        let sourceFlagTest = [];
        let sourceFlagTestLines = [];

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
                console.log(sessionData)
                console.log(dataTemp)
                let test = sourceFlagTest.join(".");
                console.log(test);
                console.log(sourceFlagTestLines);
                }
            }



            //Handles the parsing of the line
        function handleParse(currentLine){
            let parsedLine;

            //Check if the line is valid and push it to the data array
            if (validateString(currentLine)){
                parsedLine = stringToObject(currentLine);
                dataTemp.push([true, parsedLine]);
                setValidLinesCount(prevCount => prevCount + 1);
            }else {
                setInvalidLinesCount(prevCount => prevCount + 1);
                dataTemp.push([false, parsedLine]);
                return false;
            }

            const array = stringToArray(currentLine);
            const date = array[0];
            const timeStamp = timeStampMs(array[1]);
            const sourceGuid = array[3];
            const sourceName = array[4];
            const sourceFlag = array[5];
            const destName = array[7];
            const destGuid = array[6];
            const destFlag = array[8];  









            
            function checkIfNewSession(currentLine){
               

            if (!sourceFlagTest.includes(sourceFlag)){
                sourceFlagTest.push(sourceFlag);
            
            if (!sourceFlagTest.includes(destFlag)){
                sourceFlagTest.push(destFlag);
            
            if(stringDamageEventCheck(currentLine)){
                if (BOSSNAMES.includes(sourceName) && !currentSessionBOSS){
                    currentSessionBOSS = sourceName;
                }

                    if (previousTimeStamp === 0){
                        previousTimeStamp = timeStamp;
                        currentSessionStart = timeStamp;
                        lineCounterSessionStart = lineCounter;
                        dataTemp.push(stringToObject(currentLine));
                    } else if (timeStamp === previousTimeStamp){
                        dataTemp.push(stringToObject(currentLine));
                    } else if (timeStamp > previousTimeStamp + 60000){
                        console.log(flagStringToFlagObject(currentLine));

                        sessionData.push({
                            session: currentSessionBOSS,
                            timeStart: currentSessionStart,
                            timeEnd: previousTimeStamp,
                            lines: lineCounter - lineCounterSessionStart,
                            lineStart: lineCounterSessionStart,
                            lineEnd: lineCounter,
                            duration: (previousTimeStamp - currentSessionStart) / 1000,
                        });
                        dataTemp.push(stringToObject(currentLine));
                        sessionsCount ++;
                        currentSessionBOSS = false;
                        previousTimeStamp = timeStamp;
                        currentSessionStart = timeStamp;
                    } else{
                        previousTimeStamp = timeStamp;
                        dataTemp.push(stringToObject(currentLine));
                    }
        }
        lineCounter ++;
        }























        }

        const readNextChunk = () => {
            const blob = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsText(blob);
        };

    

    function handleNameAndGUID(currentLine){ //in progress
        const array = stringToArray(currentLine);
        const sourceGuid = array[3];
        const sourceName = array[4];
        const sourceFlag = array[5];
        const destGuid = array[6];
        const destName = array[7];
        const destFlag = array[8];

        playerUnits.forEach(entry => {
            const name = entry[0]; // First element is the name
            const ids = entry.slice(1); // Remaining elements are the IDs
            console.log(`Name: ${name}, IDs: ${ids.join(", ")}`);
          });
    }

    function handleFlag(string){ //in progress
        let flagCurrent = Number(string.substring(2));
        let flagObject = {};
        
        if (flagCurrent){}
        
    }
    
    
        readNextChunk();
    }

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount }}>
            {children}
        </DataContext.Provider>
    );

}