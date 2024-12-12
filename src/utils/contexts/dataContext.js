import React, { createContext, useState } from 'react';
import { parseString, damageEventCheck } from '../helpers/parseHelpers.js';
import { BOSSNAMES } from '../helpers/constants.js';

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
        let currentSessionStart = 0;
        let currentSessionBOSS = false;
        let sessionData = [];

        let lineCounter = 0;
        let lineCounterSessionStart = 0;

        let previousTimeStamp = 0;
        let previousDamageTimeStamp = 0;
        let previousDamageWithin30Seconds = false;

        let sessionsCount = 0;
        let unitNamesList = new Map();
        let unitsDataList = [];

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

            function handleNameAndGUID(){
                if(null){

                }
                    
            }

            function checkIfNewSession(){
                /* console.log("Checking if new session")
                console.log(parsedLine.isDamage)
                console.log(parsedLine.timeMs)
                console.log(lineCounter) */
                
                if(parsedLine.isDamage){

                    if (BOSSNAMES.includes(parsedLine.sourceName) && !currentSessionBOSS){
                        currentSessionBOSS = parsedLine.sourceName;
                    }

                    if (previousTimeStamp === 0){
                    
                        previousTimeStamp = parsedLine.timeMs;
                        currentSessionStart = parsedLine.timeMs;
                        lineCounterSessionStart = lineCounter;
                    
                        dataTemp.push(parsedLine);
                    
                    } else if ((parsedLine.timeMs > previousTimeStamp + 60000) || (parsedLine.destName === currentSessionBOSS && parsedLine.isUnitDead)) {
                    
                        sessionData.push({
                            session: currentSessionBOSS,
                            timeStart: currentSessionStart,
                            timeEnd: previousTimeStamp,
                            lines: lineCounter - lineCounterSessionStart,
                            lineStart: lineCounterSessionStart,
                            lineEnd: lineCounter,
                            duration: (previousTimeStamp - currentSessionStart) / 1000,
                        });
                        
                        dataTemp.push(parsedLine);
                        sessionsCount ++;
                        currentSessionBOSS = false;
                        previousTimeStamp = 0;
                        currentSessionStart = 0;
                    
                    } else {
                    
                        previousTimeStamp = parsedLine.timeMs;
                        dataTemp.push(parsedLine);
                    
                    }
                    
                  
                }
                lineCounter ++;
                

                

        }
    }
  

    function handleFlag(string){ //in progress
        let flagCurrent = Number(string.substring(2));
        let flagObject = {};
        
        if (flagCurrent){}
        
    }
    
    
        readNextChunk();
    }

    return (
        <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, sessionType, setSessionType }}>
            {children}
        </DataContext.Provider>
    );


}