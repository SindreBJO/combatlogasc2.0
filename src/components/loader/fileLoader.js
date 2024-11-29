import React, { useState, useContext } from 'react';
import './fileLoader.css';
import { DataContext } from '../../utils/contexts/dataContext';


export default function FileLoader() {
    const { progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, readNewFile } = useContext(DataContext);

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            readNewFile(file);
        } else {
            alert('Please drop a .txt file.');
        }
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        
        if (file && file.type === 'text/plain') {
            readNewFile(file);
        } else {
          alert('Please use a .txt file.');
        }
      };


    

    return (
        <div>
        <div 
            onDrop={handleDrop} 
            onDragOver={(event) => event.preventDefault()} 
            style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}
        >
            Drop your .txt file here
            <div>{progress}</div>
            <progress value={progressPercentage} max="100"></progress>
            <div>
                <h2>Valid lines: {validLinesCount}</h2>
                <h2>Invalid lines: {invalidLinesCount}</h2>
                <h2>Sessions: {sessionCount}</h2>
            </div>
        </div>
         <input type="file" onChange={handleFileChange} />
         </div>
    );
}