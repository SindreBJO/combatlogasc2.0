import React, { useContext, useState } from "react";
import "./table.css";
import { DataContext } from "../utils/contexts/dataContext";
import { AnalysisContext } from "../utils/contexts/dataAnalysisContext";

export default function PerformanceMetricsTable() {
    const { data } = useContext(DataContext);
    const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);
    const { getDamageDone } = useContext(AnalysisContext);

    // Get metrics for the selected session, fallback to empty array if not available
    const metrics = data?.sessions?.[selectedSessionIdx]?.metrics || [];

    return (
      <>
      <div className="metrics-table-container">
        <h2 className="metrics-table-title">Performance Metrics</h2>
        <div className="session-scroll-bar">
          {data?.sessions?.map((session, idx) => (
            <button
              key={idx}
              className={idx === selectedSessionIdx ? "active" : ""}
              style={{ position: "relative", width: "auto", minWidth: "80px", margin: "0 4px", display: "inline-block", padding: "15px 18px", whiteSpace: "nowrap", overflow: "visible" }}
              onClick={() => setSelectedSessionIdx(idx)}
            >
              {data.sessions[idx].bossName || `Session ${idx + 1}`}
              <span className="session-index-label">{idx + 1}</span>
            </button>
          ))}
        </div>
        <table className="metrics-table">
          <thead>
            <tr>
              <th className="metrics-table-big-thread">Name</th>
              <th className="metrics-table-big-thread">DPS</th>
              <th className="metrics-table-big-thread">Damage done</th>
              <th className="metrics-table-big-thread">Damage Taken</th>
              <th className="metrics-table-big-thread">Healing Taken</th>
              <th className="metrics-table-big-thread">Absorbed</th>
              <th className="metrics-table-big-thread">HPS</th>
              <th className="metrics-table-big-thread">Healing Done</th>
              <th className="metrics-table-big-thread">Est. Absorb</th>
              <th className="metrics-table-small-thread">Interrupts</th>
              <th className="metrics-table-small-thread">Dispels</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", color: "#888" }}>No data available</td>
              </tr>
            ) : (
              metrics.map((row, idx) => (
                <tr key={idx}>
                  <td className="metrics-table-big-thread">{row.name}</td>
                  <td className="metrics-table-big-thread">{row.dps}</td>
                  <td className="metrics-table-big-thread">{row.damageDone}</td>
                  <td className="metrics-table-big-thread">{row.damageTaken}</td>
                  <td className="metrics-table-big-thread">{row.healingTaken}</td>
                  <td className="metrics-table-big-thread">{row.absorbed}</td>
                  <td className="metrics-table-big-thread">{row.hps}</td>
                  <td className="metrics-table-big-thread">{row.healingDone}</td>
                  <td className="metrics-table-big-thread">{row.estAbsorb}</td>
                  <td className="metrics-table-small-thread">{row.interrupts}</td>
                  <td className="metrics-table-small-thread">{row.dispels}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </div>
    <div className="session-scroll-bar-wrapper">
      <div
        className="session-scroll-bar"
        style={{
          display: "flex",
          overflowX: "auto",
          whiteSpace: "nowrap",
          marginTop: "16px",
          cursor: "grab",
          userSelect: "none"
        }}
        onMouseDown={e => {
          const bar = e.currentTarget;
          bar.isDown = true;
          bar.startX = e.pageX - bar.scrollLeft;
          bar.classList.add("scrolling");
          document.body.style.cursor = "grabbing";
        }}
        onMouseLeave={e => {
          const bar = e.currentTarget;
          bar.isDown = false;
          bar.classList.remove("scrolling");
          document.body.style.cursor = "auto";
        }}
        onMouseUp={e => {
          const bar = e.currentTarget;
          bar.isDown = false;
          bar.classList.remove("scrolling");
          document.body.style.cursor = "auto";
        }}
        onMouseMove={e => {
          const bar = e.currentTarget;
          if (!bar.isDown) return;
          e.preventDefault();
          bar.scrollLeft = e.pageX - bar.startX;
        }}
      >
      </div>
    </div>
    </>
    );
}
