import React, { useState, useContext } from 'react';
import './fileLoader.wow.css';
import { DataContext } from '../../utils/contexts/dataContext';


export default function FileLoader() {
    const { progress, progressPercentage, validLinesCount, invalidLinesCount, sessionCount, readNewFile, inputYear, setInputYear, setInputDamageTimeout } = useContext(DataContext);
    const [dragActive, setDragActive] = useState(false);

    function handleDrop(event) {
        event.preventDefault();
        setDragActive(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            readNewFile(files[0]);
        }
    }

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragActive(false);
    };

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            readNewFile(files[0]);
        }
    };

    return (
        <div className="file-loader-container wow-wotlk-bg">
          <div className="file-loader-card wow-wotlk-card">
            <div className='file-loader-title-wrapper wow-wotlk-titlebar'>
            <h2 className="file-loader-title wow-wotlk-title">Combat Log Parser</h2>
            </div>
            <div className="file-loader-inputs wow-wotlk-inputs">
              <input
                id="yearInput"
                className="file-loader-input wow-wotlk-input"
                type="text"
                value={inputYear ?? ""}
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val)) {
                    setInputYear(val);
                  }
                }}
                placeholder={"Year (" + new Date().getFullYear() + ")"}
              />
              <input
                id="damageTimeoutInput"
                className="file-loader-input wow-wotlk-input"
                type="text"
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val)) {
                    setInputDamageTimeout(val);
                  }
                }}
                placeholder="Session Timeout (50) (range: 20-120)"
              />
            </div>
            <div
              className={`file-loader-dropzone wow-wotlk-dropzone${dragActive ? ' dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <span className="file-loader-droptext wow-wotlk-droptext">Drop your .txt file or folder here or select below</span>
              <input
                className="file-loader-fileinput"
                type="file"
                onChange={handleFileChange}
                multiple
                webkitdirectory="true"
                directory="true"
              />
            </div>
            <div className="file-loader-progress wow-wotlk-progress">
              <div>{progress}</div>
              <progress value={progressPercentage} max="100" className="file-loader-progressbar wow-wotlk-progressbar"></progress>
            </div>
            <div className="file-loader-stats wow-wotlk-stats">
              <div>Valid lines: <span>{validLinesCount}</span></div>
              <div>Invalid lines: <span>{invalidLinesCount}</span></div>
              <div>Sessions: <span>{sessionCount}</span></div>
            </div>
          </div>
        </div>
    );
}