import React, { createContext, useState } from 'react';

// Create the context
export const DataContext = createContext();

const CHUNK_SIZE = 50 * 1024;

// Create a provider component
export const DataContextProvider = ({ children }) => {

    const [progress, setProgress] = useState('');
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [validLinesCount, setValidLinesCount] = useState(0);
    const [invalidLinesCount, setInvalidLinesCount] = useState(0);
    const [fileData, setFileData] = useState();
    const [sessions , setSessions] = useState([]);
    const [sessionLines, setSessionLines] = useState([]);
    const [sessionCount, setSessionCount] = useState(0);
    
    function main (file){
        
        const reader = new FileReader();
        let offset;
        let carryOver;
        let validLines;
        let invalidLines;
        let lineCount;
        let currentSessionLines;
        let sessionLines;
        let previousTimeStamp;
        let sessionsCount;
        let allUnits;
        let playerUnits;
        let hostileUnits;
        let friendlyUnits;

        resetLocalVariables();
        resetContextVariables();

        validateAndParseSessionsWithFile();




        function validateAndParseSessionsWithFile(){
            divideFileIntoChunks();
        }

        function divideFileIntoChunks(){
            
        }

  

        function resetContextVariables(){
            setFileData(file);
            setValidLinesCount(0);
            setInvalidLinesCount(0);
            setProgress('Reading file...');
            setProgressPercentage(0);
            setSessionCount(0);
            setSessionLines([]);
            setSessions([]);
        }

        function resetLocalVariables(){
            offset = 0;
            carryOver = '';
            validLines = [];
            invalidLines = [];
            lineCount = 0;
            currentSessionLines = [];
            sessionLines = [];
            previousTimeStamp = 0;
            sessionsCount = 0;
            allUnits = [];
            playerUnits = [];
            hostileUnits = [];
            friendlyUnits = [];
        }

    }

    return (
        <DataContext.Provider value={{ }}>
            {children}
        </DataContext.Provider>
    );
};