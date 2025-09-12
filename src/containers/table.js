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
    <div className="metricTable-container fadein">
      <div className="metricTable-title-wrapper fadein">
      <h2 className="metricTable-title fadein">Available Sessions</h2>
      </div>
      <div className="session-buttons-bar fadein">
        {!data || !data.sessions || data.sessions.length === 0
          ? <div><p className="session-btns-none fadein">No sessions found!</p></div>
          : data.sessions.map((session, idx) => {
              let btnClass = `session-btn${selectedSessionIdx === idx ? ' active' : ''}`;
              let outcomeClass = '';
              if (session.outcome === 'VictoryBoss') outcomeClass = 'session-btn-victoryboss';
              else if (session.outcome === 'VictoryTrash') outcomeClass = 'session-btn-victorytrash';
              else if (session.outcome === 'Wipe') outcomeClass = 'session-btn-wipe';
              else if (session.outcome === 'Timeout') outcomeClass = 'session-btn-timeout';
              else if (session.bossName === 'Trash') outcomeClass = 'session-btn-trash';
              return (
                <button
                  key={idx}
                  className={`${btnClass} ${outcomeClass} fadein`}
                  onClick={() => setSelectedSessionIdx(idx)}
                >
                  <span className="session-btn-label fadein">{session.bossName || session.name || `Session ${idx + 1}`}</span>
                  <span className={`session-btn-index${selectedSessionIdx === idx ? ' active' : ''} fadein`}>{idx + 1}</span>
                </button>
              );
            })
        }
      </div>
      <div className="metricTable-title-wrapper fadein">
      <h2 className="metricTable-title fadein">Selected Session</h2>
      </div>
      {/* Session Info Panel */}
      <div className="session-info-panel fadein">
        {data.sessions && data.sessions[selectedSessionIdx] ? (() => {
          const session = data.sessions[selectedSessionIdx];
          const start = session.startTime ? new Date(session.startTime) : null;
          const end = session.endTime ? new Date(session.endTime) : null;
          const durationSec = session.encounterLengthSec ? session.encounterLengthSec.toFixed(1) : 'N/A';
          return (
            <>
              <div className="session-info-panel-flex fadein">
                <div className="session-info-panel-section fadein">
                  <h3 className="session-info-panel-title fadein">Session #{selectedSessionIdx + 1}</h3>
                  <div className="session-info-panel-boss-row fadein"><b className="session-info-panel-label fadein">Boss:</b> <span className={session.bossName === 'Trash' ? 'session-info-panel-boss-trash fadein' : 'session-info-panel-boss fadein'}>{session.bossName || 'Trash'}</span></div>
                  <div className="session-info-panel-outcome-row fadein"><b className="session-info-panel-label fadein">Outcome:</b> <span className={session.outcome === 'VictoryBoss' ? 'session-info-panel-outcome-victory fadein' : session.outcome === 'Wipe' ? 'session-info-panel-outcome-wipe fadein' : 'session-info-panel-outcome-other fadein'}>{session.outcome}</span></div>
                  <div className="session-info-panel-date-row fadein"><b className="session-info-panel-label fadein">Date:</b> <span className="session-info-panel-value fadein">{session.dayNumber}/{session.monthNumber}/{session.year}</span></div>
                  <div className="session-info-panel-start-row fadein"><b className="session-info-panel-label fadein">Start:</b> <span className="session-info-panel-value fadein">{start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}</span></div>
                  <div className="session-info-panel-end-row fadein"><b className="session-info-panel-label fadein">End:</b> <span className="session-info-panel-value fadein">{end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}</span></div>
                  <div className="session-info-panel-duration-row fadein"><b className="session-info-panel-label fadein">Duration:</b> <span className="session-info-panel-value fadein">{durationSec} sec</span></div>
                  <div className="session-info-panel-players-row fadein"><b className="session-info-panel-label fadein">Players:</b> <span className="session-info-panel-value fadein">{session.entitiesData.players.length}</span></div>
                </div>
                <div className="session-info-panel-section session-info-panel-playerstatus fadein">
                  <b className="session-info-panel-label fadein">Player Status:</b>
                  <ul className="session-info-panel-player-list fadein">
                    {session.entitiesData.players.length === 0 ? (
                      <li className="session-info-panel-player-none fadein">No players</li>
                    ) : session.entitiesData.players.map((p, i) => (
                      <li key={i} className={`session-info-panel-player-row fadein ${p.alive === false ? 'session-info-panel-player-dead' : 'session-info-panel-player-alive'}`}> 
                        <span className="session-info-panel-player-name fadein">{p.name}</span>
                        {p.alive === false ? (
                          <>
                            <span className="session-info-panel-player-dead fadein">&#10006; Dead</span>
                            {p.diedAt ? (
                              <span className="session-info-panel-player-status fadein">
                                (at {(
                                  p.diedAt.timeStamp && session.startTime
                                    ? ((p.diedAt.timeStamp - session.startTime) / 1000).toFixed(1)
                                    : 'N/A')
                                }s)
                              </span>
                            ) : null}
                          </>
                        ) : <span className="session-info-panel-player-alive fadein">&#10004; Alive</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Enemy Status Section */}
                <div className="session-info-panel-section session-info-panel-playerstatus fadein">
                  <b className="session-info-panel-label fadein">Enemy Status:</b>
                  <ul className="session-info-panel-player-list fadein">
                    {session.entitiesData.enemyNPCs && session.entitiesData.enemyNPCs.length === 0 ? (
                      <li className="session-info-panel-player-none fadein">No enemies</li>
                    ) : session.entitiesData.enemyNPCs && session.entitiesData.enemyNPCs.map((e, i) => (
                      <li key={i} className={`session-info-panel-player-row fadein ${e.alive === false ? 'session-info-panel-player-dead' : 'session-info-panel-player-alive'}`}> 
                        <span className="session-info-panel-player-name fadein">{
                          Array.isArray(e.names) && e.names.length > 0
                            ? e.names[0]
                            : (e.name || e.npcName || e.displayName || '(unnamed)')
                        }</span>
                        {e.alive === false ? (
                          <>
                            <span className="session-info-panel-player-dead fadein">&#10006; Dead</span>
                            {e.diedAt ? (
                              <span className="session-info-panel-player-status fadein">
                                (at {(
                                  e.diedAt.timeStamp && session.startTime
                                    ? ((e.diedAt.timeStamp - session.startTime) / 1000).toFixed(1)
                                    : 'N/A')
                                }s)
                              </span>
                            ) : null}
                          </>
                        ) : <span className="session-info-panel-player-alive fadein">&#10004; Alive</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="session-info-panel-section fadein">
                  <b className="session-info-panel-label fadein">Session Metadata:</b>
                  <ul className="session-info-panel-meta-list fadein">
                    <li className="fadein"><b className="session-info-panel-label fadein">Start Line:</b> <span className="session-info-panel-value fadein">{session.dataIndexStart}</span></li>
                    <li className="fadein"><b className="session-info-panel-label fadein">End Line:</b> <span className="session-info-panel-value fadein">{session.dataIndexEnd}</span></li>
                    <li className="fadein"><b className="session-info-panel-label fadein">Last Damage Line:</b> <span className="session-info-panel-value fadein">{session.lastDamageIndexAt}</span></li>
                    <li className="fadein"><b className="session-info-panel-label fadein">Start Parse Event:</b> <span className="session-info-panel-value fadein">{session.startParse ? session.startParse.event?.join(' ') : 'N/A'}</span></li>
                    <li className="fadein"><b className="session-info-panel-label fadein">End Parse Event:</b> <span className="session-info-panel-value fadein">{session.endParse ? session.endParse.event?.join(' ') : 'N/A'}</span></li>
                  </ul>
                </div>
              </div>
            </>
          );
        })() : <div className="session-info-panel-noselection fadein">No session selected</div>}
      </div>
      <div className="metricTable-title-wrapper fadein">
      <h2 className="metricTable-title fadein">Preformance Metrics</h2>
      </div>
      <table className="metrics-table metrics-table-modern fadein">
        <thead className="fadein">
          <tr className="fadein">
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-name" title="Player Name">
              <div className="metricTable-header-inner">Name</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-dps" title="Damage Per Second">
              <div className="metricTable-header-inner">DPS</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-damage" title="Total Damage Done">
              <div className="metricTable-header-inner">Damage Done</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-damagetaken" title="Total Damage Taken">
              <div className="metricTable-header-inner">Damage Taken</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-healingtaken" title="Total Healing Taken">
              <div className="metricTable-header-inner">Healing Taken</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-absorbed" title="Total Absorbed">
              <div className="metricTable-header-inner">Absorbed</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-hps" title="Healing Per Second">
              <div className="metricTable-header-inner">HPS</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-healingdone" title="Total Healing Done">
              <div className="metricTable-header-inner">HealingDone</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-estabsorb" title="Estimated Absorbs">
              <div className="metricTable-header-inner">Est.Absorb</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-interrupts" title="Interrupts">
              <div className="metricTable-header-inner">Interrupts</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-dispels" title="Dispels">
              <div className="metricTable-header-inner">Dispels</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-purges" title="Purges">
              <div className="metricTable-header-inner">Purges</div>
            </th>
          </tr>
        </thead>
        <tbody className="fadein">
          {players.length === 0 ? (
            <tr className="fadein">
              <td colSpan={12} className="metrics-table-nodata fadein">No player data available</td>
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
                  <tr key={idx} className="fadein">
                    <td className="metricTable-header-text fadein">{player.name}</td>
                    <td className="metricTable-header-text fadein">{player.dps}</td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-damage-bar-wrap fadein">
                        <div className="metricTable-damage-bar fadein" style={{ width: `${percent * 100}%` }}></div>
                        <span className="metricTable-damage-bar-label fadein">{player.totalDamage}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">{player.damageTaken}</td>
                    <td className="metricTable-header-text fadein">{player.healingTaken}</td>
                    <td className="metricTable-header-text fadein">{player.absorbed}</td>
                    <td className="metricTable-header-text fadein">{player.hps}</td>
                    <td className="metricTable-header-text fadein">{player.healingDone}</td>
                    <td className="metricTable-header-text fadein">{player.estAbsorb}</td>
                    <td className="metricTable-header-text fadein">{player.interrupts}</td>
                    <td className="metricTable-header-text fadein">{player.dispels}</td>
                    <td className="metricTable-header-text fadein">{player.purges}</td>
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
