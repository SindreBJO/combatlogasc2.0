import React, { useContext, useEffect, useState } from "react";
import "./table.css";
import { DataContext } from "../utils/contexts/dataContext";
import { getEntityTableData, getRaidDamageGraphPoints, getRaidDamageTakenGraphPoints} from "../utils/helpers/analaysisHelpers";
import skillIcon from "../assets/tableicons/skullIcon.png";
import rebirthIcon from "../assets/tableicons/rebirth.png";
import ColoredAreaChart from "./graph/graph";
import ColoredAreaChartDamageTaken from "./graphOverallTakenAndHealed/graph";


export default function PerformanceMetricsTable() {

  // Contexts
  const {data, setFinishedParsing, setStartNewSession} = useContext(DataContext);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);
  const [session, setSession] = useState(data.sessions[selectedSessionIdx] || {});
  const [sessionRaidGraphPoints, setSessionRaidGraphPoints] = useState();
  const [sessionRaidGraphPointsDamageTaken, setSessionRaidGraphPointsDamageTaken] = useState();

  // Session info
  const [sessionPrint, setSessionPrint ] = useState({});
  const [start , setStart ] = useState(session.startTime ? new Date(session.startTime) : null);
  const [end , setEnd ] = useState(session.endTime ? new Date(session.endTime) : null);
  const [durationSec , setDurationSec ] = useState(session.encounterLengthSec ? session.encounterLengthSec : 'N/A');


  // UI state
  const [showMeta, setShowMeta] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [expandedNames, setExpandedNames] = useState({});
  // Toggle expand/collapse for grouped enemies
  const toggleGroup = (name) => setExpandedNames(prev => ({ ...prev, [name]: !prev[name] }));


  const [players, setPlayers] = useState([]);
  const [pets, setPets] = useState([]);
  const [enemies, setEnemies] = useState([]);

  const handleSortPlayers = () => {
    
  };

  useEffect(() => {
    console.log("%c-- INITIATING VERIFYING --", "color: green");
    if (!data.sessions || !data.sessions[selectedSessionIdx]) return;
    console.log("%c-- INITIATING TABLE DATA --", "color: green");
    const session = data.sessions[selectedSessionIdx];
    setSession(session);
    const { entitiesData, ...filteredSession } = session;
    setSessionPrint(filteredSession);
    const sessionData = data.data.filter(
      (line, index) =>
        index >= session.dataIndexStart && index <= session.dataIndexEnd
    );
  
    if (!session.entitiesData.players) return;
  
    const playerRows = session.entitiesData.players
      .map((playerObj) => {
        const tableData = getEntityTableData(playerObj, sessionData, session);
        return tableData;
      })
      .sort((a, b) => (b.combatStats.totalDamage || 0) - (a.combatStats.totalDamage || 0));

    const petRows = session.entitiesData.pets
      .map((petObj) => {
        const tableData = getEntityTableData(petObj, sessionData, session);
        return tableData;
      })
      .sort((a, b) => (b.combatStats.totalDamage || 0) - (a.combatStats.totalDamage || 0));

const enemyRows = Object.values(
  session.entitiesData.enemyNPCs
    .map((enemyObj) => getEntityTableData(enemyObj, sessionData, session))
    .filter(Boolean)
    .reduce((acc, enemy) => {
      const name = enemy.identity.name;
      const id = enemy.identity.id;
      const n = (v) => parseFloat(v) || 0;

      const clone = JSON.parse(JSON.stringify(enemy));

      if (!acc[name]) {
        acc[name] = {
          identity: {
            name,
            ids: [id], // start with one id
          },
          combatStats: {
            dps: n(enemy.combatStats.dps),
            totalDamage: n(enemy.combatStats.totalDamage),
            damageTaken: n(enemy.combatStats.damageTaken),
            totalHealingDone: n(enemy.combatStats.totalHealingDone),
            healingTaken: n(enemy.combatStats.healingTaken),
            hps: n(enemy.combatStats.hps),
          },
          units: [clone],
        };
      } else {
        const existing = acc[name].combatStats;
        const current = enemy.combatStats;

        // combine numeric stats
        existing.totalDamage += n(current.totalDamage);
        existing.dps += n(current.dps);
        existing.damageTaken += n(current.damageTaken);
        existing.totalHealingDone += n(current.totalHealingDone);
        existing.healingTaken += n(current.healingTaken);
        existing.hps += n(current.hps);

        // push unique IDs
        const ids = acc[name].identity.ids;
        if (!ids.includes(id)) ids.push(id);

        acc[name].units.push(clone);
      }

      return acc;
    }, {})
)
.sort(
  (a, b) =>
    (parseFloat(b.combatStats.totalDamage) || 0) -
    (parseFloat(a.combatStats.totalDamage) || 0)
);



  console.log("Enemy Rows:", enemyRows);


    const sessionDamageDonePoints = getRaidDamageGraphPoints(sessionData, session);
    setSessionRaidGraphPoints(sessionDamageDonePoints);
    const sessionDamageTakenPoints = getRaidDamageTakenGraphPoints(sessionData, session);
    setSessionRaidGraphPointsDamageTaken(sessionDamageTakenPoints);
    
    console.log("Player rows:", playerRows);
    setPlayers(playerRows);
    setPets(petRows);
    setEnemies(enemyRows);
    setStart(session.startTime ? new Date(session.startTime) : null);
    setEnd(session.endTime ? new Date(session.endTime) : null);
    setDurationSec(session.encounterLengthSec ? session.encounterLengthSec : 'N/A');

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
      <div className="table-section-title-wrapper fadein">
      <h2 className="table-section-title fadein">Available Sessions</h2>
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
      <div className="table-section-title-wrapper fadein">
      <h2 className="table-section-title fadein">Selected Session</h2>
      </div>
      {/* Session Status/Data Panel */}
      <div className="session-info-panel fadein">
  {data.sessions && data.sessions[selectedSessionIdx] ? (() => {
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


        {/* Dev Info toggle */}
        <div className="session-info-panel-section fadein">
          <button onClick={() => setShowDevInfo(!showDevInfo)}>
            {showDevInfo ? 'Hide Dev Info' : 'Show Dev Info'}
          </button>
          {showDevInfo && (
            <pre style={{ background: '#111', color: '#9f9', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(sessionPrint, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  })() : <div className="session-info-panel-noselection fadein">No session selected</div>}
</div>
       
      <div className="table-section-title-wrapper fadein">
      <h2 className="table-section-title fadein">Preformance Metrics</h2>
      </div>
      

      <div className="metricTable-wrapper">
        <div className="metricTable-selectedSessionData fadein">
            <p>Session{" "}{selectedSessionIdx + 1}</p>
            <p>{session.bossName || 'Trash'}</p>
            <p>{session.outcome}</p>
            <p>{session.encounterLengthSec
              ? (() => {
                  const totalMs = session.encounterLengthSec * 1000;
                  const minutes = Math.floor(totalMs / 60000);
                  const seconds = Math.floor((totalMs % 60000) / 1000);
                  const milliseconds = ((totalMs % 1000) / 1000).toFixed(1).slice(2);
                  return `${minutes}:${seconds.toString().padStart(2, '0')},${milliseconds} min`;
                })()
              : ''}</p>
            <p>{session.dayNumber}/{session.monthNumber}/{session.year}</p>

      </div>
              <ColoredAreaChart shadows={false} dataPoints={sessionRaidGraphPoints} name={"dps"} color="#ff0000" />
              <ColoredAreaChartDamageTaken shadows={false} dataPoints={sessionRaidGraphPointsDamageTaken} color="#00ff00" />
      <table className="metrics-table metrics-table-modern fadein">
        <thead className="fadein">    
          <tr className="fadein">
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-name" title="Player Name">
              <div className="metricTable-header-inner">Entity</div>
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
              <div className="metricTable-header-inner">Absorb Taken</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-hps" title="Healing Per Second">
              <div className="metricTable-header-inner">HPS</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-healingdone" title="Total Healing Done">
              <div className="metricTable-header-inner">HealingDone</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-interrupts" title="Interrupts">
              <div className="metricTable-header-inner">Interrupts</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-dispels" title="Dispels">
              <div className="metricTable-header-inner">Raid Dispels</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-purges" title="Purges">
            </th>
          </tr>
        </thead>
        <tbody className="fadein">
            {(() => {
              const raidData = {
                identity: players.length > 5 ? "Raid" : "Party",
                combatStats: {
                  dps: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.dps) || 0), 0),
                totalDamage: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalDamage) || 0), 0),
                damageTaken: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.damageTaken) || 0), 0),
                healingTaken: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.healingTaken) || 0), 0),
                absorbedTaken: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalAbsorbedTaken) || 0), 0),
                hps: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.hps) || 0), 0),
                totalHealingDone: players.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalHealingDone) || 0), 0),
                },
                utility: {},
                meta: {},
              };
            
              return (
                
                <tr key={999} className="overall-row fadein" style={{ color: "#FFFAFA", backgroundColor: "rgba(0, 0, 0, 0.4)"}}>
                  <td className="metricTable-cell-name fadein">
                    <p className={session.outcome === "Wipe" ? "deadText metricTable-cell-overall" : "metricTable-cell-overall"}>{raidData.identity}</p>
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.absorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">-</td>
                  <td className="metricTable-cell-overall">-</td>
                  <td className="metricTable-cell-overall">-</td>
                </tr>
              );
            })()}
          {players.length === 0 ? (
            <tr className="fadein">
              <td colSpan={11} className="metrics-table-nodata fadein">No player data available</td>
            </tr>
            
          ) : (
            (() => {
              // Find min and max totalDamage for bar scaling
              if (players.length === 0) return null;
              const maxDamageDone = Math.max(...players.map(p => p.combatStats.totalDamage));
              const minDamageDone = 0;
              const maxDamageTaken = Math.max(...players.map(p => p.combatStats.damageTaken));
              const minDamageTaken = 0;
              const maxAbsorbDone = Math.max(...players.map(p => p.combatStats.totalAbsorbedTaken));
              const minAbsorbDone = 0;
              const minHealingTaken = 0;
              const maxHealingTaken = Math.max(...players.map(p => p.combatStats.healingTaken));
              const minHealingDone = Math.min(...players.map(p => p.combatStats.totalHealingDone));
              const maxHealingDone = Math.max(...players.map(p => p.combatStats.totalHealingDone));

              return players.map((player, idx) => {
                // Calculate fill percent (0-1)
                const DmgDonepercent = maxDamageDone === minDamageDone ? 1 : (player.combatStats.totalDamage - minDamageDone) / (maxDamageDone - minDamageDone);
                const DmgTakenpercent = maxDamageTaken === minDamageTaken ? 1 : (player.combatStats.damageTaken - minDamageTaken) / (maxDamageTaken - minDamageTaken);
                const AbsorbDonepercent = maxAbsorbDone === minAbsorbDone ? 1 : (player.combatStats.totalAbsorbedTaken - minAbsorbDone) / (maxAbsorbDone - minAbsorbDone);
                const HealingTakenpercent = minHealingTaken === maxHealingTaken ? 1 : (player.combatStats.healingTaken - minHealingTaken) / (maxHealingTaken - minHealingTaken);
                const HealingDonepercent = minHealingDone === maxHealingDone ? 1 : (player.combatStats.totalHealingDone - minHealingDone) / (maxHealingDone - minHealingDone);
                
                return (
                  <tr key={idx} className="fadein">
                    <td className="metricTable-cell-name fadein" 
                      name={player.identity.name}
                      id={player.identity.id}
                      processtype={player.identity.processType}
                      entitytype={player.identity.entityType}
                    >
                      <div className="metricTable-cell-name-inner">
                        {player.meta.ressurectedStatus && <img src={rebirthIcon} className="ressed-icon-img"/>}{!player.meta.aliveStatus && <img src={skillIcon} className="death-icon-img"/>}<p  className={player.meta.aliveStatus ? "" : "deadText"}>{player.identity.name ? player.identity.name : "-"}</p>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageDone-color fadein"  
                        style={
                          player.combatStats.dps !== "0"
                            ? { width: `${Math.max(DmgDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{player.combatStats.dps && player.combatStats.dps !== "0"  ? player.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                    
                        
                        <span className="metricTable-cell-text">{player.combatStats.totalDamage && player.combatStats.totalDamage !== "0" ? player.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                     
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageTaken-color fadein"   
                        style={
                          player.combatStats.damageTaken !== 0
                            ? { width: `${Math.max(DmgTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{player.combatStats.damageTaken ? player.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-healingTaken-color fadein"  
                        style={
                          player.combatStats.healingTaken !== 0
                            ? { width: `${Math.max(HealingTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{player.combatStats.healingTaken ? player.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-absorbTaken-color fadein"    
                        style={
                          player.combatStats.totalAbsorbedTaken !== 0
                            ? { width: `${Math.max(AbsorbDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span  className="metricTable-cell-text fadein">{player.combatStats.totalAbsorbedTaken ? player.combatStats.totalAbsorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-hps-color fadein"  
                        style={
                          player.combatStats.hps !== "0"
                            ? { width: `${Math.max(HealingDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{player.combatStats.hps && player.combatStats.hps !== "0" ? player.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                        <span className="metricTable-cell-text fadein">{player.combatStats.totalHealingDone ? player.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                    </td>
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





















    
      <table className="metrics-table metrics-table-modern fadein">
        
        <tbody className="fadein">
            {(() => {
              const raidData = {
                identity: "Pets",
                combatStats: {
                  dps: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.dps) || 0), 0),
                totalDamage: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalDamage) || 0), 0),
                damageTaken: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.damageTaken) || 0), 0),
                healingTaken: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.healingTaken) || 0), 0),
                absorbedTaken: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalAbsorbedTaken) || 0), 0),
                hps: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.hps) || 0), 0),
                totalHealingDone: pets.reduce((sum, obj) => sum + (Number(obj.combatStats?.totalHealingDone) || 0), 0),

                },
                utility: {},
                meta: {},
              };
            
              return (
                <tr key={999} className="overall-row fadein" style={{ color: "#FFFAFA", backgroundColor: "rgba(0, 0, 0, 0.4)"}}>
                  <td className="metricTable-cell-name fadein">
                    <p className="metricTable-cell-overall">{raidData.identity}</p>
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.absorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">
                    {raidData.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </td>
                  <td className="metricTable-cell-overall">-</td>
                  <td className="metricTable-cell-overall">-</td>
                  <td className="metricTable-cell-overall">-</td>
                </tr>
              );
            })()}
          {pets.length === 0 ? (
            <tr className="fadein">
              <td colSpan={12} className="metrics-table-nodata fadein">No player data available</td>
            </tr>
          ) : (
            (() => {
              // Find min and max totalDamage for bar scaling
              if (pets.length === 0) return null;
              const maxDamageDone = Math.max(...pets.map(p => p.combatStats.totalDamage));
              const minDamageDone = 0;
              const maxDamageTaken = Math.max(...pets.map(p => p.combatStats.damageTaken));
              const minDamageTaken = 0;
              const maxAbsorbDone = Math.max(...pets.map(p => p.combatStats.totalAbsorbedTaken));
              const minAbsorbDone = 0;
              const minHealingTaken = 0;
              const maxHealingTaken = Math.max(...pets.map(p => p.combatStats.healingTaken));
              const minHealingDone = Math.min(...pets.map(p => p.combatStats.totalHealingDone));
              const maxHealingDone = Math.max(...pets.map(p => p.combatStats.totalHealingDone));

              return pets.map((pet, idx) => {
                // Calculate fill percent (0-1)
                const DmgDonepercent = maxDamageDone === minDamageDone ? 1 : (pet.combatStats.totalDamage - minDamageDone) / (maxDamageDone - minDamageDone);
                const DmgTakenpercent = maxDamageTaken === minDamageTaken ? 1 : (pet.combatStats.damageTaken - minDamageTaken) / (maxDamageTaken - minDamageTaken);
                const AbsorbDonepercent = maxAbsorbDone === minAbsorbDone ? 1 : (pet.combatStats.totalAbsorbedTaken - minAbsorbDone) / (maxAbsorbDone - minAbsorbDone);
                const HealingTakenpercent = minHealingTaken === maxHealingTaken ? 1 : (pet.combatStats.healingTaken - minHealingTaken) / (maxHealingTaken - minHealingTaken);
                const HealingDonepercent = minHealingDone === maxHealingDone ? 1 : (pet.combatStats.totalHealingDone - minHealingDone) / (maxHealingDone - minHealingDone);
                
                return (
                  <tr key={idx} className="fadein">
                    <td className="metricTable-cell-name fadein" 
                      name={pet.identity.name}
                      id={pet.identity.id}
                      processtype={pet.identity.processType}
                      entitytype={pet.identity.entityType}
                    >
                      {pet.identity.name ? pet.identity.name : "-"}
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageDone-color fadein"  
                        style={
                          pet.combatStats.dps !== "0"
                            ? { width: `${Math.max(DmgDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{pet.combatStats.dps && pet.combatStats.dps !== "0"  ? pet.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                    
                        
                        <span className="metricTable-cell-text">{pet.combatStats.totalDamage && pet.combatStats.totalDamage !== "0" ? pet.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                     
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageTaken-color fadein"   
                        style={
                          pet.combatStats.damageTaken !== 0
                            ? { width: `${Math.max(DmgTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{pet.combatStats.damageTaken ? pet.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-healingTaken-color fadein"  
                        style={
                          pet.combatStats.healingTaken !== 0
                            ? { width: `${Math.max(HealingTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{pet.combatStats.healingTaken ? pet.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-absorbTaken-color fadein"    
                        style={
                          pet.combatStats.totalAbsorbedTaken !== 0
                            ? { width: `${Math.max(AbsorbDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span  className="metricTable-cell-text fadein">{pet.combatStats.totalAbsorbedTaken ? pet.combatStats.totalAbsorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-hps-color fadein"  
                        style={
                          pet.combatStats.hps !== "0"
                            ? { width: `${Math.max(HealingDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{pet.combatStats.hps && pet.combatStats.hps !== "0" ? pet.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                        <span className="metricTable-cell-text fadein">{pet.combatStats.totalHealingDone ? pet.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                    </td>
                    <td className="metricTable-header-text fadein">{pet.interrupts ? pet.interrupts : "-"}</td>
                    <td className="metricTable-header-text fadein">{pet.dispels ? pet.dispels : "-"}</td>
                    <td className="metricTable-header-text fadein">{pet.purges ? pet.purges : "-"}</td>
                  </tr>
                );
              });
            })()
          )}
        </tbody>
      </table>



    <table className="metrics-table metrics-table-modern fadein">
        <thead className="fadein">
          <tr className="fadein">
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-name" title="Player Name">
              <div className="metricTable-header-inner">Enemies</div>
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
              <div className="metricTable-header-inner">Absorb Taken</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-hps" title="Healing Per Second">
              <div className="metricTable-header-inner">HPS</div>
            </th>
            <th className="metricTable-header-text metricTable-big-cell fadein metricTable-header-healingdone" title="Total Healing Done">
              <div className="metricTable-header-inner">HealingDone</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-interrupts" title="Interrupts">
              <div className="metricTable-header-inner">Interrupts</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-dispels" title="Dispels">
              <div className="metricTable-header-inner">Raid Dispels</div>
            </th>
            <th className="metricTable-header-text metricTable-small-cell fadein metricTable-header-purges" title="Purges">
              <div className="metricTable-header-inner">Enemy Dispels</div>
            </th>
          </tr>
        </thead>
        <tbody className="fadein">
          {enemies.length === 0 ? (
            <tr className="fadein">
              <td colSpan={12} className="metrics-table-nodata fadein">No player data available</td>
            </tr>
          ) : (
            (() => {
              // Find min and max totalDamage for bar scaling
              if (enemies.length === 0) return null;
              const maxDamageDone = Math.max(...enemies.map(p => Number(p.combatStats.totalDamage) || 0));
              const minDamageDone = 0;
              const maxDamageTaken = Math.max(...enemies.map(p => Number(p.combatStats.damageTaken) || 0));
              const minDamageTaken = 0;
              const maxAbsorbDone = Math.max(...enemies.map(p => Number(p.combatStats.totalAbsorbedTaken) || 0));
              const minAbsorbDone = 0;
              const minHealingTaken = 0;
              const maxHealingTaken = Math.max(...enemies.map(p => Number(p.combatStats.healingTaken) || 0));
              const minHealingDone = Math.min(...enemies.map(p => Number(p.combatStats.totalHealingDone) || 0));
              const maxHealingDone = Math.max(...enemies.map(p => Number(p.combatStats.totalHealingDone) || 0));

              const renderRow = (item, key, opts = {}) => {
                const dmg = Number(item.combatStats?.totalDamage) || 0;
                const dmgTaken = Number(item.combatStats?.damageTaken) || 0;
                const dps = item.combatStats?.dps || "0";
                const AbsorbDonepercent = maxAbsorbDone === minAbsorbDone ? 1 : ((Number(item.combatStats?.totalAbsorbedTaken) || 0) - minAbsorbDone) / (maxAbsorbDone - minAbsorbDone || 1);
                const DmgDonepercent = maxDamageDone === minDamageDone ? 1 : (dmg - minDamageDone) / (maxDamageDone - minDamageDone || 1);
                const DmgTakenpercent = maxDamageTaken === minDamageTaken ? 1 : (dmgTaken - minDamageTaken) / (maxDamageTaken - minDamageTaken || 1);
                const HealingTakenpercent = minHealingTaken === maxHealingTaken ? 1 : ((Number(item.combatStats?.healingTaken) || 0) - minHealingTaken) / (maxHealingTaken - minHealingTaken || 1);
                const HealingDonepercent = minHealingDone === maxHealingDone ? 1 : ((Number(item.combatStats?.totalHealingDone) || 0) - minHealingDone) / (maxHealingDone - minHealingDone || 1);

                return (
                  <tr key={key} className="fadein">
                    <td
                      className="metricTable-cell-name metricTable-enemy-name-cell fadein" 
                      name={item.identity?.name}
                      id={item.identity?.id}
                      processtype={item.identity?.processType}
                      entitytype={item.identity?.entityType}
                    >
                        {opts.showCollapse && <button className="small-inline-btn" onClick={() => toggleGroup(opts.groupName)}>-</button>}
                        {opts.showExpand && <button className="small-inline-btn" onClick={() => toggleGroup(opts.groupName)}>{`+ (${opts.count})`}</button>}
                        <span>{item.identity?.name || "-"}</span>
                    </td>

                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageDone-color fadein"  
                        style={
                          dps !== "0"
                            ? { width: `${Math.max(DmgDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{dps && dps !== "0"  ? dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>

                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <span className="metricTable-cell-text">{dmg ? dmg.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                    </td>

                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageTaken-color fadein"   
                        style={
                          dmgTaken !== 0
                            ? { width: `${Math.max(DmgTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{dmgTaken ? dmgTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>

                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-healingTaken-color fadein"  
                        style={
                          (Number(item.combatStats?.healingTaken) || 0) !== 0
                            ? { width: `${Math.max(HealingTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein">{item.combatStats?.healingTaken ? (Number(item.combatStats.healingTaken).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")) : "-"}</span>
                      </div>
                    </td>

                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-absorbTaken-color fadein"    
                        style={
                          (Number(item.combatStats?.totalAbsorbedTaken) || 0) !== 0
                            ? { width: `${Math.max(AbsorbDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span  className="metricTable-cell-text fadein">{item.combatStats?.totalAbsorbedTaken ? (Number(item.combatStats.totalAbsorbedTaken).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")) : "-"}</span>
                      </div>
                    </td>

                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-hps-color fadein"  
                        style={
                          item.combatStats?.hps !== "0"
                            ? { width: `${Math.max(HealingDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">{item.combatStats?.hps && item.combatStats.hps !== "0" ? item.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>

                    <td className="metricTable-header-text fadein">
                        <span className="metricTable-cell-text fadein">{item.combatStats?.totalHealingDone ? (Number(item.combatStats.totalHealingDone).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")) : "-"}</span>
                    </td>
                    <td className="metricTable-header-text fadein">{item.interrupts ? item.interrupts : "-"}</td>
                    <td className="metricTable-header-text fadein">{item.dispels ? item.dispels : "-"}</td>
                    <td className="metricTable-header-text fadein">{item.purges ? item.purges : "-"}</td>
                  </tr>
                );
              };

              // Build rows: grouped summary or expanded unit rows
              return enemies.flatMap((enemy, idx) => {
                const name = enemy.identity?.name || `Enemy ${idx}`;
                const isGroup = Array.isArray(enemy.units) && enemy.units.length > 1;
                const isExpanded = !!expandedNames[name];

                if (isGroup && isExpanded) {
                  // show each unit individually; first unit gets a Collapse button
                  return enemy.units.map((unit, uidx) => renderRow(unit, `enemy-${idx}-unit-${uidx}`, { showCollapse: uidx === 0, groupName: name }));
                }

                // show single summary row (for non-group or collapsed group)
                return renderRow(enemy, `enemy-summary-${idx}`, { showExpand: isGroup, count: isGroup ? enemy.units.length : 0, groupName: name });
              });
            })()
          )}
        </tbody>
      </table>







</div>



















      
    </div>
  );
}
