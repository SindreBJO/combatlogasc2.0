import React, { useRef, useState, useEffect, useCallback } from "react";
import "./slideSessionTimeBar.css";

export default function SessionSlideBar({ sessionDuration, slideTime, setSlideTime }) {
    
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [tempRange, setTempRange] = useState(slideTime);

  useEffect(() => setTempRange(slideTime), [slideTime]);

  const [sessionStart, sessionEnd] = sessionDuration;
  const [absMin, absMax] = tempRange;

  const totalDurationSec = (sessionEnd - sessionStart) / 1000;
  const minValSec = (absMin - sessionStart) / 1000;
  const maxValSec = (absMax - sessionStart) / 1000;

  const valueToPercent = (val) => (val / totalDurationSec) * 100;
  const percentToValue = (pct) => (pct / 100) * totalDurationSec;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startDrag = (type) => setDragging(type);
  const stopDrag = useCallback(() => {
    if (dragging) {
      setSlideTime(tempRange); // full Unix ms
      setDragging(null);
    }
  }, [dragging, tempRange, setSlideTime]);

  const handleMove = useCallback(
    (e) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      const pct = (x / rect.width) * 100;
      const newValSec = Math.min(Math.max(percentToValue(pct), 0), totalDurationSec);

      if (dragging === "min") {
        const newMin = Math.min(newValSec, maxValSec - 0.1);
        setTempRange([
          sessionStart + newMin * 1000,
          sessionStart + maxValSec * 1000,
        ]);
      } else {
        const newMax = Math.max(newValSec, minValSec + 0.1);
        setTempRange([
          sessionStart + minValSec * 1000,
          sessionStart + newMax * 1000,
        ]);
      }
    },
    [dragging, minValSec, maxValSec, sessionStart, percentToValue, totalDurationSec]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [handleMove, stopDrag]);

  const minPct = valueToPercent(minValSec);
  const maxPct = valueToPercent(maxValSec);
  const diffSec = maxValSec - minValSec;

  return (
    <div className="session-slider">
      <div className="slider-values">
        {/* ✅ show seconds (relative) */}
        <span>Start: {minValSec.toFixed(0)}</span>
        <span>Duration: {diffSec.toFixed(0)}</span>
        <span>End: {maxValSec.toFixed(0)} sec</span>
      </div>

      <div ref={trackRef} className="slider-track">
        <div
          className="slider-range"
          style={{
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
          }}
        />
        <div
          className="slider-thumb"
          style={{ left: `${minPct}%` }}
          onMouseDown={() => startDrag("min")}
        />
        <div
          className="slider-thumb"
          style={{ left: `${maxPct}%` }}
          onMouseDown={() => startDrag("max")}
        />
      </div>
    </div>
  );
}
