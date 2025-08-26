import React, { createContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Helpers
import { parseString, setGlobalYear, testArrayLength } from '../helpers/parseHelpers.js';
import { BOSSNAMES, MultipleIdMonsters } from '../helpers/constants.js';

// Redux actions
import { startSession, endSession, addSessionMeta } from '../stores/sessionSlice.js';

export const DataContext = createContext();
// File is read, parsed data is stored, tests are done and sessions are declared here

const CHUNK_SIZE = 50 * 1024;

export const DataContextProvider = ({ children }) => {
    const [progress, setProgress] = useState('Ready for use');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [inputYear, setInputYear] = useState();
    const [inputDamageTimeout, setInputDamageTimeout] = useState();
    const [data, setData] = useState([]);

    const dispatch = useDispatch();
    // Use Redux session state
    const sessionState = useSelector(state => state.session);
    const sessionActive = sessionState.sessionActive;
    const currentSessionData = sessionState.currentSessionData;

    useEffect(() => {
        setGlobalYear(inputYear || new Date().getFullYear())
    }, [inputYear]);

    useEffect(() => {
        if (inputDamageTimeout > 120 || inputDamageTimeout < 20 || inputDamageTimeout === undefined) {
            setInputDamageTimeout(50);
        }
    }, [inputDamageTimeout]);

    const reader = new FileReader();
    let offset = 0;
    let carryOver = '';

    let metaData = {
        sessions:[],
        data: [],
        dataIndexStart: null,
        dataIndexEnd: 0,
        dataTimeLength: 0,
        dataTimeStampStart: 0,
        dataTimeStampEnd: 0,
    };
    let indexLine = 0;
    let invalidData = [];
    let parsedObject = null;

    function readNewFile(file) {
        // Reset all variables
        setData([]);
        setValidLinesCount(0);
        setInvalidLinesCount(0);
        setProgress('Loadingstate');
        setProgressPercentage(0);
        setSessionCount(0);
        // Reset Redux session state
        dispatch({ type: 'session/resetSessionState' });

        reader.onload = (event) => {
            const text = carryOver + event.target.result;
            const newLines = text.split('\n');
            carryOver = newLines.pop();
            newLines.forEach(line => {
                handleParse(line);
            });
            offset += CHUNK_SIZE;
            setProgress(`Progress: ${(Math.min(offset, file.size) * 100 / file.size).toFixed(3)} %`);
            setProgressPercentage((offset / file.size) * 100);
            if (offset < file.size) {
                readNextChunk();
            } else {
                metaData.dataIndexEnd = indexLine;
                metaData.dataTimeStampEnd = parsedObject?.timeStamp;
                handleParse(carryOver);
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
                console.log(metaData)
                console.log(invalidData)
            }   
                
        }

            const readNextChunk = () => {
                const blob = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(blob);
            };

            function handleParse(unparsedLine){
                parsedObject = parseString(unparsedLine);
                if (parsedObject) {
                    if (metaData.dataTimeStampStart === 0) { metaData.dataTimeStampStart = parsedObject.timeStamp }
                    handleSession();
                    setValidLinesCount(prevCount => prevCount + 1);
                    metaData.data.push(parsedObject);
                    indexLine++;
                }
                if (unparsedLine === "" || unparsedLine === "\r") { return } // Skips all empty lines
                if (parsedObject === false) {
                    setInvalidLinesCount(prevCount => prevCount + 1);
                    invalidData.push(unparsedLine.replace(/\r/g, ''));
                    return;
                }
            }

            // SESSION HANDLING (Redux)
            function handleSession(){
                if (!sessionActive && ["DAMAGE", "MISSED"].includes(parsedObject.event[1])) {
                    dispatch(startSession({
                        startParse: parsedObject,
                        startTime: parsedObject.timeStamp,
                        dataIndexStart: indexLine
                    }));
                }
                if (sessionActive) {
                    if (["DAMAGE", "MISSED"].includes(parsedObject.event[1])) {

                    }
                    // Boss name logic (Redux meta update)
                    if ((currentSessionData?.bossName === "Trash") && BOSSNAMES.includes(parsedObject.sourceName) && parsedObject.sourceFlag === "enemyNPC") {
                        dispatch(addSessionMeta({ bossName: parsedObject.sourceName }));
                    }
                    if ((currentSessionData?.bossName === "Trash") && BOSSNAMES.includes(parsedObject.destName) && parsedObject.destFlag === "enemyNPC") {
                        dispatch(addSessionMeta({ bossName: parsedObject.destName }));
                    }
                    // ...existing code for entity/session data, refactor to use Redux if needed...
                    if ((parsedObject.destName === currentSessionData?.bossName) && (parsedObject.event[1] === "UNITDIED")) {
                        dispatch(addSessionMeta({ outcome: "Victory" }));
                        dispatch(endSession());
                    }
                }
            }
            // ...existing code for helpers (lengthTest, etc)...
            // Remove all local session mutations, use Redux actions/selectors only
        
    
        readNextChunk();

}


return (
    <DataContext.Provider value={{ readNewFile, data, progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, inputYear, setInputYear, setInputDamageTimeout }}>
        {children}
    </DataContext.Provider>
);

}