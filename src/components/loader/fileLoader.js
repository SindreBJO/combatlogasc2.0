import React, { useState, useContext } from 'react';
import './fileLoader.css';
import { DataContext } from '../../utils/contexts/dataContext';


export default function FileLoader() {
    const { progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, readNewFile, inputYear, setInputYear, setInputDamageTimeout } = useContext(DataContext);

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
        <div className="file-loader-container">
          <div className="file-loader-card">
            <h2 className="file-loader-title">Combat Log Parser</h2>
            <div className="file-loader-inputs">
              <input
                id="yearInput"
                className="file-loader-input"
                type="text"
                value={inputYear ?? ""}
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val)) {
                    setInputYear(val);
                  }
                }}
                placeholder={new Date().getFullYear()}
              />
              <input
                id="damageTimeoutInput"
                className="file-loader-input"
                type="text"
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val)) {
                    setInputDamageTimeout(val);
                  }
                }}
                placeholder="60 sec (range: 20-120)"
              />
            </div>
            <div 
              className="file-loader-dropzone"
              onDrop={handleDrop} 
              onDragOver={(event) => event.preventDefault()} 
            >
              <span className="file-loader-droptext">Drop your .txt file here or select below</span>
              <input className="file-loader-fileinput" type="file" onChange={handleFileChange} />
            </div>
            <div className="file-loader-progress">
              <div>{progress}</div>
              <progress value={progressPercentage} max="100" className="file-loader-progressbar"></progress>
            </div>
            <div className="file-loader-stats">
              <div>Valid lines: <span>{validLinesCount}</span></div>
              <div>Invalid lines: <span>{invalidLinesCount}</span></div>
              <div>Sessions: <span>{sessionCount}</span></div>
            </div>
          </div>
        </div>
    );
}