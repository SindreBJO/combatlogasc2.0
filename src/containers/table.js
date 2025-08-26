import React, { useContext, useEffect, useState } from "react";
import "./table.css";
import { DataContext } from "../utils/contexts/dataContext";
import { getEntityTableData } from "../utils/helpers/analaysisHelpers";

export default function PerformanceMetricsTable() {

  const { data } = useContext(DataContext);


  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  const [players, setPlayers] = useState([]);

  useEffect(() => {
        console.log(`%c-- INITIATING VERIFYING --`, 'color: green')
    if (!data.sessions || !data.sessions[selectedSessionIdx]) return;
        console.log(`%c-- INITIATING TABLE DATA --`, 'color: green')
    const session = data.sessions[selectedSessionIdx];
    if (!session.entitiesData.players) return;
    const playerRows = session.entitiesData.players
      .map(playerObj => getEntityTableData(data, playerObj, selectedSessionIdx))
      .sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0));
    console.log("Player rows:", playerRows);
    setPlayers(playerRows);
  }, [data, selectedSessionIdx]);

  return (
    <div className="metricTable-container">
      <div className="metricTable-title-wrapper">
      <h2 className="metricTable-title">Sessions</h2>
      </div>
      <div className="session-buttons-bar">
        {!data || !data.sessions || data.sessions.length === 0
          ? <div><p style={{color: "black"}}>No sessions found!</p></div>
          : data.sessions.map((session, idx) => {
              let btnClass = `session-btn${selectedSessionIdx === idx ? ' active' : ''}`;
              let btnStyle = { position: 'relative' };
              if (session.bossName === 'Trash') {
                btnStyle.background = '#e53935'; // red
              } else if (session.bossName) {
                btnStyle.background = '#ffd600'; // yellow
              }
              if (session.outcome === 'Victory') {
                btnStyle.background = '#43a047'; // green
              }
              return (
                <button
                  key={idx}
                  className={btnClass}
                  style={btnStyle}
                  onClick={() => setSelectedSessionIdx(idx)}
                >

                  {session.bossName || session.name || `Session ${idx + 1}`}
                  <span className="session-btn-index">{idx + 1}</span>
                </button>
              );
            })
        }
      </div>
      <div className="metricTable-title-wrapper">
      <h2 className="metricTable-title">Preformance Metrics</h2>
      </div>
      <table className="metrics-table">
        <thead>
          <tr>
            <th className="metricTable-header-text metricTable-big-cell">Name</th>
            <th className="metricTable-header-text metricTable-small-cell">DPS</th>
            <th className="metricTable-header-text metricTable-big-cell">Damage Done</th>
            <th className="metricTable-header-text metricTable-big-cell">Damage Taken</th>
            <th className="metricTable-header-text metricTable-big-cell">Healing Taken</th>
            <th className="metricTable-header-text metricTable-big-cell">Absorbed</th>
            <th className="metricTable-header-text metricTable-small-cell">HPS</th>
            <th className="metricTable-header-text metricTable-big-cell">Healing Done</th>
            <th className="metricTable-header-text metricTable-big-cell">Est. Absorb</th>
            <th className="metricTable-header-text metricTable-small-cell">Interrupts</th>
            <th className="metricTable-header-text metricTable-small-cell">Dispels</th>
            <th className="metricTable-header-text metricTable-small-cell">Purges</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ textAlign: 'center', color: '#888' }}>No player data available</td>
            </tr>
          ) : (
            (() => {
              // Find min and max totalDamage for bar scaling
              const maxDamage = Math.max(...players.map(p => p.totalDamage || 0));
              const minDamage = Math.min(...players.map(p => p.totalDamage || 0));
              return players.map((player, idx) => {
                // Calculate fill percent (0-1)
                const percent = maxDamage === minDamage ? 1 : (player.totalDamage - minDamage) / (maxDamage - minDamage);
                return (
                  <tr key={idx}>
                    <td className="metricTable-header-text">{player.name}</td>
                    <td className="metricTable-header-text">{player.dps}</td>
                    <td className="metricTable-header-text" style={{ padding: 0, height: '100%' }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        minWidth: 60,
                        minHeight: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        background: 'none'
                      }}>
                        <div style={{
                          width: `${percent * 100}%`,
                          height: '100%',
                          background: '#43a047',
                          borderRadius: 8, // Keep the fill bar rounded for visual appeal
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          zIndex: 1,
                          transition: 'width 0.4s cubic-bezier(.4,2,.6,1)'
                        }}></div>
                        <span style={{
                          position: 'relative',
                          zIndex: 2,
                          color: '#23272f',
                          fontWeight: 600,
                          paddingLeft: 8,
                          paddingRight: 8,
                          width: '100%',
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}>{player.totalDamage}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text">{player.damageTaken}</td>
                    <td className="metricTable-header-text">{player.healingTaken}</td>
                    <td className="metricTable-header-text">{player.absorbed}</td>
                    <td className="metricTable-header-text">{player.hps}</td>
                    <td className="metricTable-header-text">{player.healingDone}</td>
                    <td className="metricTable-header-text">{player.estAbsorb}</td>
                    <td className="metricTable-header-text">{player.interrupts}</td>
                    <td className="metricTable-header-text">{player.dispels}</td>
                    <td className="metricTable-header-text">{player.purges}</td>
                  </tr>
                );
              });
            })()
          )}
        </tbody>
      </table>
    </div>
  );
}
