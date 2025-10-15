import React, { useContext, useEffect, useState } from "react";
import "./table.css";
import { DataContext } from "../utils/contexts/dataContext";
import { getEntityTableData } from "../utils/helpers/analaysisHelpers";


export default function PerformanceMetricsTable() {

  const { data, setFinishedParsing, setStartNewSession } = useContext(DataContext);


  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  const session = data.sessions[selectedSessionIdx];
  const start = session.startTime ? new Date(session.startTime) : null;
  const end = session.endTime ? new Date(session.endTime) : null;
  const durationSec = session.encounterLengthSec ? session.encounterLengthSec.toFixed(1) : 'N/A';

  // state hooks
  const [showMeta, setShowMeta] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [expandedNames, setExpandedNames] = useState({});

  const [players, setPlayers] = useState([]);










  useEffect(() => {
    console.log("%c-- INITIATING VERIFYING --", "color: green");
    if (!data.sessions || !data.sessions[selectedSessionIdx]) return;
    
    console.log("%c-- INITIATING TABLE DATA --", "color: green");
    const session = data.sessions[selectedSessionIdx];
    const sessionData = data.data.filter(
      (line, index) =>
        index >= session.dataIndexStart && index <= session.dataIndexEnd
    );
  
    if (!session.entitiesData.players) return;
  
    const playerRows = session.entitiesData.players
      .map((playerObj) => {
        console.log("PlayerObj:", playerObj);
        const tableData = getEntityTableData(playerObj, sessionData, session.encounterLengthSec);
        console.log("TableData:", tableData);
        return tableData;
      })
      .sort((a, b) => (b.combatStats.totalDamage || 0) - (a.combatStats.totalDamage || 0));
    
    console.log("Player rows:", playerRows);
    setPlayers(playerRows);
  }, [data, selectedSessionIdx]);










  const toggleCurrentNewSession = () => {
    setFinishedParsing(false);
    setStartNewSession(true);
  }

  return (
    <div className="metricTable-container fadein">
      {/*Return Button */}
    <button className="nav-button" onClick={toggleCurrentNewSession}><span>New session</span></button>
      {/*Session selection */}
      <div className="metricTable-title-wrapper fadein">
      <h2 className="metricTable-title fadein">Available Sessions</h2>
      </div>
      {/*Session selection - button */}
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
      {/* Session Status/Data Panel */}
      <div className="session-info-panel fadein">
  {data.sessions && data.sessions[selectedSessionIdx] ? (() => {

    // 
    const groupByName = (entities) => {
      const groups = {};
      if (!entities) return groups;
      entities.forEach((e) => {
        const name = e.name || e.npcName || e.displayName || (Array.isArray(e.names) ? e.names[0] : '(unnamed)');
        if (!groups[name]) groups[name] = [];
        groups[name].push(e);
      });
      return groups;
    };

    const playerGroups = groupByName(session.entitiesData.players);
    const enemyGroups = groupByName(session.entitiesData.enemyNPCs);

    const toggleGroup = (name) => setExpandedNames(prev => ({ ...prev, [name]: !prev[name] }));

    return (
      <div className="session-info-panel-flex fadein">
        {/* General */}
        <div className="session-info-panel-section fadein">
          <h3 className="session-info-panel-title fadein">Session #{selectedSessionIdx + 1}</h3>
          <div><b>Boss:</b> {session.bossName || 'Trash'}</div>
          <div><b>Outcome:</b> {session.outcome}</div>
          <div><b>Date:</b> {session.dayNumber}/{session.monthNumber}/{session.year}</div>
          <div><b>Start:</b> {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}</div>
          <div><b>End:</b> {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}</div>
          <div><b>Duration:</b> {durationSec} sec</div>
          <div><b>Players:</b> {session.entitiesData.players.length}</div>
        </div>

        {/* Players */}
        <div className="session-info-panel-section fadein">
          <b>Player Status:</b>
          <ul className="session-info-panel-player-list fadein">
            {Object.entries(playerGroups).length === 0 ? (
              <li>No players</li>
            ) : Object.entries(playerGroups).map(([name, group], i) => (
              <li key={i}>
                {group.length > 1 ? (
                  <>
                    <button onClick={() => toggleGroup(name)}>
                      {expandedNames[name] ? `Hide ${name} (${group.length})` : `${name} (${group.length})`}
                    </button>
                    {expandedNames[name] && group.map((p, j) => (
                      <div key={j} className="session-info-panel-player-alive-status">
                        {p.name} {p.alive ? <p className="alive-text">✔ Alive</p> : <p className="dead-text">✖ Dead</p>}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="session-info-panel-player-alive-status">
                  {name} {group[0].alive ? <p className="alive-text">✔ Alive</p>  : <p className="dead-text">✖ Dead</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Enemies */}
        <div className="session-info-panel-section fadein">
          <b>Enemy Status:</b>
          <ul className="session-info-panel-player-list fadein">
            {Object.entries(enemyGroups).length === 0 ? (
              <li>No enemies</li>
            ) : Object.entries(enemyGroups).map(([name, group], i) => (
              <li key={i}>
                {group.length > 1 ? (
                  <>
                    <button onClick={() => toggleGroup(name)}>
                      {expandedNames[name] ? `Hide ${name} (${group.length})` : `${name} (${group.length})`}
                    </button>
                    {expandedNames[name] && group.map((e, j) => (
                      <div key={j} className="session-info-panel-player-alive-status">
                        {name} {e.alive ? <p className="alive-text">✔ Alive</p> : <p className="dead-text">✖ Dead</p>}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="session-info-panel-player-alive-status">
                    {name} {group[0].alive ? <p className="alive-text">✔ Alive</p> : <p className="dead-text">✖ Dead</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Metadata toggle */}
        <div className="session-info-panel-section fadein">
          <button onClick={() => setShowMeta(!showMeta)}>
            {showMeta ? 'Hide Metadata' : 'Show Metadata'}
          </button>
          {showMeta && (
            <ul>
              <li><b>Start Line:</b> {session.dataIndexStart}</li>
              <li><b>End Line:</b> {session.dataIndexEnd}</li>
              <li><b>Last Damage Line:</b> {session.lastDamageIndexAt}</li>
              <li><b>Start Parse Event:</b> {session.startParse?.event?.join(' ') || 'N/A'}</li>
              <li><b>End Parse Event:</b> {session.endParse?.event?.join(' ') || 'N/A'}</li>
            </ul>
          )}
        </div>

        {/* Dev Info toggle */}
        <div className="session-info-panel-section fadein">
          <button onClick={() => setShowDevInfo(!showDevInfo)}>
            {showDevInfo ? 'Hide Dev Info' : 'Show Dev Info'}
          </button>
          {showDevInfo && (
            <pre style={{ background: '#111', color: '#9f9', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(session, null, 2)}
            </pre>
          )}
        </div>
      </div>
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
              <div className="metricTable-header-inner">Absorb Done</div>
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
              if (players.length === 0) return null;
              const maxDamageDone = Math.max(...players.map(p => p.combatStats.totalDamage || 0));
              const minDamageDone = Math.min(...players.map(p => p.combatStats.totalDamage || 0));
              const maxDamageTaken = Math.max(...players.map(p => p.combatStats.damageTaken || 0));
              const minDamageTaken = Math.min(...players.map(p => p.combatStats.damageTaken || 0));
              const maxAbsorbDone = Math.max(...players.map(p => p.combatStats.totalAbsorbedTaken || 0));
              const minAbsorbDone = Math.min(...players.map(p => p.combatStats.totalAbsorbedTaken || 0));
              const minHealingTaken = Math.min(...players.map(p => p.combatStats.healingTaken || 0));
              const maxHealingTaken = Math.max(...players.map(p => p.combatStats.healingTaken || 0));
              return players.map((player, idx) => {
                // Calculate fill percent (0-1)
                const DmgDonepercent = maxDamageDone === minDamageDone ? 1 : (player.combatStats.totalDamage - minDamageDone) / (maxDamageDone - minDamageDone);
                const DmgTakenpercent = maxDamageTaken === minDamageTaken ? 1 : (player.combatStats.damageTaken - minDamageTaken) / (maxDamageTaken - minDamageTaken);
                const AbsorbDonepercent = maxAbsorbDone === minAbsorbDone ? 1 : (player.combatStats.totalAbsorbedTaken - minAbsorbDone) / (maxAbsorbDone - minAbsorbDone);
                const HealingTakenpercent = minHealingTaken === maxHealingTaken ? 1 : (player.combatStats.healingTaken - minHealingTaken) / (maxHealingTaken - minHealingTaken);
                return (
                  <tr key={idx} className="fadein">
                    <td className="metricTable-header-text fadein" 
                      name={player.identity.name}
                      id={player.identity.id}
                      processtype={player.identity.processType}
                      entitytype={player.identity.entityType}
                    >
                      {player.identity.name ? player.identity.name : "-"}
                      </td>
                    <td className="metricTable-header-text fadein">{player.combatStats.dps ? player.combatStats.dps : "-"}</td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-damage-bar-wrap fadein">
                        <div className="metricTable-damage-bar fadein" style={{ width: `${Math.max(DmgDonepercent * 100, 10)}%` }}></div>
                        <span className="metricTable-damageTaken-bar-label fadein">{player.combatStats.totalDamage ? player.combatStats.totalDamage : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-damage-bar-wrap fadein">
                        <div className="metricTable-damageTaken-bar fadein" style={{ width: `${Math.max(DmgTakenpercent * 100, 10)}%` }}></div>
                        <span className="metricTable-damage-bar-label fadein">{player.combatStats.damageTaken ? player.combatStats.damageTaken : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-damage-bar-wrap fadein">
                        <div className="metricTable-damageTaken-bar fadein" style={{ width: `${Math.max(HealingTakenpercent * 100, 10)}%` }}></div>
                        <span className="metricTable-damage-bar-label fadein">{player.combatStats.healingTaken ? player.combatStats.healingTaken : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-damage-bar-wrap fadein">
                        <div className="metricTable-damageTaken-bar fadein" style={{ width: `${Math.max(AbsorbDonepercent * 100, 10)}%` }}></div>
                        <span className="metricTable-damage-bar-label fadein">{player.combatStats.totalAbsorbedTaken ? player.combatStats.totalAbsorbedTaken : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">{player.hps ? player.hps : "-"}</td>
                    <td className="metricTable-header-text fadein">{player.combatStats.totalHealingDone ? player.combatStats.totalHealingDone : "-"}</td>
                    <td className="metricTable-header-text fadein">{player.estAbsorb ? player.estAbsorb : "-"}</td>
                    <td className="metricTable-header-text fadein">{player.interrupts ? player.interrupts : "-"}</td>
                    <td className="metricTable-header-text fadein">{player.dispels ? player.dispels : "-"}</td>
                    <td className="metricTable-header-text fadein">{player.purges ? player.purges : "-"}</td>
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
