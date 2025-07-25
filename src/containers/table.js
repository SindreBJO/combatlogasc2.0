import React, { useContext, useEffect, useState } from "react";
import "./table.css";
import { AnalysisContext } from "../utils/contexts/dataAnalysisContext";
import { DataContext } from "../utils/contexts/dataContext";

export default function PerformanceMetricsTable({ metrics = [] }) {

    const { data } = useContext(DataContext);
    const { getDamageDone } = useContext(AnalysisContext);
    const [ metricsData, setMetricsData ] = useState([]);

    useEffect(() => {
        if (data && data.sessions) {
            const newMetrics = data.sessions.map(session => {
                return {
                    name: session.sourceName,
                    dps: getDamageDone(session.sourceName, session.startLine, session.endLine, session.sourceFlag),
                    hps: session.healingDone,
                    damageTaken: session.damageTaken,
                    healingDone: session.healingDone,
                    deaths: session.deaths,
                    interrupts: session.interrupts,
                    dispels: session.dispels,
                    uptime: session.uptime
                };
            });
            setMetricsData(newMetrics);
        }
    }, [data]);

  return (
    <div className="metrics-table-container">
      <h2 className="metrics-table-title">WoW Performance Metrics</h2>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>DPS</th>
            <th>HPS</th>
            <th>Damage Taken</th>
            <th>Healing Done</th>
            <th>Deaths</th>
            <th>Interrupts</th>
            <th>Dispels</th>
            <th>Uptime</th>
          </tr>
        </thead>
        <tbody>
          {metrics.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", color: "#888" }}>No data available</td>
            </tr>
          ) : (
            metrics.map((row, idx) => (
              <tr key={idx}>
                <td>{row.name}</td>
                <td>{row.dps}</td>
                <td>{row.hps}</td>
                <td>{row.damageTaken}</td>
                <td>{row.healingDone}</td>
                <td>{row.deaths}</td>
                <td>{row.interrupts}</td>
                <td>{row.dispels}</td>
                <td>{row.uptime}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
