import React, { useContext, useEffect, useState } from "react";
import "./table.css";
import {SPELL_SCHOOL_COLORS} from "../utils/helpers/constants";
import { DataContext } from "../utils/contexts/dataContext";
import { getEntityTableData, getRaidDamageGraphPoints, getRaidDamageTakenGraphPoints, getDamageDoneUIBreakDown} from "../utils/helpers/analaysisHelpers";
import skillIcon from "../assets/tableicons/skullIcon.png";
import rebirthIcon from "../assets/tableicons/rebirth.png";
import ColoredAreaChart from "./graph/graph";
import ColoredAreaChartDamageTaken from "./graphOverallTakenAndHealed/graph";
import SessionSlideBar from "../components/slideSessionTimeBar/slideSessionTimeBar";

export default function PerformanceMetricsTable() {

  // Contexts
  const {data, setFinishedParsing, setStartNewSession} = useContext(DataContext);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);
  const [session, setSession] = useState(data.sessions[selectedSessionIdx] || {});
  const [sessionRaidGraphPoints, setSessionRaidGraphPoints] = useState();
  const [sessionRaidGraphPointsDamageTaken, setSessionRaidGraphPointsDamageTaken] = useState();
  const [loading, setLoading] = useState(true);

  // Selected UI/Entity Data
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState({});
  const [previous, setPrevious] = useState(null);
  const [selectedEntityData, setSelectedEntityData] = useState({ spells: [], totals: {} })

  // Session info
  const [sessionPrint, setSessionPrint ] = useState({});
  const [sessionTime, setSessionTime] = useState([data.sessions[selectedSessionIdx].startTime, data.sessions[selectedSessionIdx].endTime]);
  const [slideTime, setSlideTime] = useState([data.sessions[selectedSessionIdx].startTime, data.sessions[selectedSessionIdx].endTime]);

  // UI state
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [expandedNames, setExpandedNames] = useState({});
  // Toggle expand/collapse for grouped enemies
  const toggleGroup = (name) => setExpandedNames(prev => ({ ...prev, [name]: !prev[name] }));


  const [players, setPlayers] = useState([]);
  const [pets, setPets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  

  useEffect(() => {
    setTimeout(() => {
    if (!data.sessions || !data.sessions[selectedSessionIdx]) return;
    const modifiedSessionData = { 
      ...data.sessions[selectedSessionIdx], 
      startTime: slideTime[0], 
      endTime: slideTime[1], 
      encounterLengthMs: slideTime[1] - slideTime[0], 
      encounterLengthSec: (slideTime[1] - slideTime[0]) / 1000,
      realEncounterStartTime: data.sessions[selectedSessionIdx].startTime,
      realEncounterEndTime: data.sessions[selectedSessionIdx].endTime,
    };
    console.log("%c-- INITIATING TABLE DATA --", "color: green");
    const session = data.sessions[selectedSessionIdx];
    setSession(session);
    const { entitiesData, ...filteredSession } = session;
    setSessionPrint(filteredSession);
    const sessionData = data.data.filter(
      (line, index) =>
        index >= session.dataIndexStart && index <= session.dataIndexEnd && line.timeStamp >= slideTime[0] && line.timeStamp <= slideTime[1]
    );
  
    if (!session.entitiesData.players) return;
    const playerRows = session.entitiesData.players
      .map((playerObj) => {
        const tableData = getEntityTableData(playerObj, sessionData, modifiedSessionData);
        return tableData;
      })
      .sort((a, b) => (b.combatStats.totalDamage || 0) - (a.combatStats.totalDamage || 0));
      
    const petRows = session.entitiesData.pets
      .map((petObj) => {
        const tableData = getEntityTableData(petObj, sessionData, modifiedSessionData);
        return tableData;
      })
      .sort((a, b) => (b.combatStats.totalDamage || 0) - (a.combatStats.totalDamage || 0));

    const enemyRows = Object.values(
      session.entitiesData.enemyNPCs
        .map((enemyObj) => getEntityTableData(enemyObj, sessionData, modifiedSessionData))
        .filter(Boolean)
        .reduce((acc, enemy) => {
      const name = enemy.identity.name;
      const n = (v) => parseFloat(v) || 0;
      const clone = JSON.parse(JSON.stringify(enemy));
      // ensure we always have an array of ids on the incoming enemy
      const incomingIds = Array.isArray(enemy.identity?.ids)
        ? enemy.identity.ids
        : enemy.identity?.id
        ? [enemy.identity.id]
        : [];

      if (!acc[name]) {
        acc[name] = {
          identity: {
            name,
            ids: incomingIds.slice(), // copy
            entityType: enemy.identity.entityType,
            processType: enemy.identity.processType,
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

        // add any new ids, deduped
        const targetIds = acc[name].identity.ids;
        incomingIds.forEach((iid) => {
          if (!targetIds.includes(iid)) targetIds.push(iid);
        });

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


    const sessionDamageDonePoints = getRaidDamageGraphPoints(sessionData, modifiedSessionData);
    setSessionRaidGraphPoints(sessionDamageDonePoints);
    const sessionDamageTakenPoints = getRaidDamageTakenGraphPoints(sessionData, modifiedSessionData);
    setSessionRaidGraphPointsDamageTaken(sessionDamageTakenPoints);
    
    console.log("Player rows:", playerRows);
    setPlayers(playerRows);
    setPets(petRows);
    setEnemies(enemyRows);
    setLoading(false);
}, 300);
  }, [data, selectedSessionIdx, slideTime]);

  useEffect(() => {
    setTimeout(() => {
    console.log("start")
    if (selectedScene === null || selectedEntity === null || selectedEntity.identity === undefined) return;
    console.log("continuing")
    const modifiedSessionData = { 
      ...data.sessions[selectedSessionIdx], 
      startTime: slideTime[0], 
      endTime: slideTime[1], 
      encounterLengthMs: slideTime[1] - slideTime[0], 
      encounterLengthSec: (slideTime[1] - slideTime[0]) / 1000,
      realEncounterStartTime: data.sessions[selectedSessionIdx].startTime,
      realEncounterEndTime: data.sessions[selectedSessionIdx].endTime,
    };
    const sessionData = data.data.filter(
      (line, index) =>
        index >= modifiedSessionData.dataIndexStart && index <= modifiedSessionData.dataIndexEnd && line.timeStamp >= slideTime[0] && line.timeStamp <= slideTime[1]
    );
    const idSet = new Set(selectedEntity.identity.ids);
    const dealtData = sessionData.filter((line) => idSet.has(line.sourceGUID) && line.spellName !== "Stagger");
    const takenData = sessionData.filter((line) => idSet.has(line.destGUID));
     if (selectedScene === "DamageDoneUI") {
       const raw = getDamageDoneUIBreakDown(dealtData) || {};
       const normalized = {
         totals: (raw.totals && typeof raw.totals === "object") ? raw.totals : {},
         spells: Array.isArray(raw.spells) ? raw.spells : (raw.spells ? Object.values(raw.spells) : []),
       };
       setSelectedEntityData(normalized);
       console.log("DamageDoneUI Data:", normalized);
     }
    console.log("finished")
    setLoading(false);
}, 300);
  }, [selectedScene, selectedEntity]);











































  const handleSelect = (scene, entity) => {
    // store current selection before switching
    setLoading(true);
    setPrevious([selectedScene, selectedEntity]);
    setSelectedScene(scene);
    setSelectedEntity(entity);
    console.log("Selected:", scene, entity);
  };

  const handleUndo = (e) => {
    e.preventDefault(); // stop right-click menu
    console.log("Undoing to previous selection:", previous);
    if (previous) {
      setSelectedScene(previous[0]);
      setSelectedEntity(previous[1]);
      setPrevious(null); // clear after undo if you want single-step undo
    }
    console.log("Current selection after undo:", selectedScene, selectedEntity);
    return;
  };

  const toggleCurrentNewSession = () => {
    setFinishedParsing(false);
    setStartNewSession(true);
  }

 const [tooltip, setTooltip] = useState({
  visible: false,
  x: 0,
  y: 0,
  content: null
});

useEffect(() => {
  const handleMouseMove = (e) => {
    // update position only when tooltip is visible to avoid excessive state updates
    setTooltip(prev => prev.visible ? ({
      ...prev,
      x: e.clientX + 6,
      y: e.clientY + 6,
    }) : prev);
  };

  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, []); // run once

function showTooltip(content, e) {
  const x = e?.clientX ?? 0;
  const y = e?.clientY ?? 0;
  setTooltip({ visible: true, x: x + 12, y: y + 12, content });
}

function hideTooltip() {
  setTooltip(prev => ({ ...prev, visible: false }));
}





































  return (
    <div className="metricTable-container" onContextMenu={handleUndo}>
    
      {/*Return Button */}
    <button className="nav-button" onClick={toggleCurrentNewSession}><span>New session</span></button>
      {/*Session selection */}
      <div className="table-section-title-wrapper fadein">
      <h2 className="table-section-title fadein">Available Sessions</h2>
      </div>
      {/*Session selection - button */}
      <div className="session-buttons-bar fadein">
        {!data || !data.sessions || data.sessions.length === 0
          ? <div><p className='session-btns-none fadein '>No sessions found!</p></div>
          : data.sessions.map((session, idx) => {
              let btnClass = `session-btn${selectedSessionIdx === idx ? ' session-btn-active' : ''}`;
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
                  onClick={() => {
                    setLoading(true);
                    setSelectedSessionIdx(idx);
                    setSlideTime([session.startTime, session.endTime]);
                    setSessionTime([session.startTime, session.endTime]);
                    setSelectedScene(null);
                    setPrevious(null);
                  }}
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
      
{selectedScene === null &&
      <div className="metricTable-wrapper"  style={{ display: loading ? "none" : "" }}>
        <div className="metricTable-selectedSessionData fadein">
                      <p>{session.bossName || 'Trash'}</p>
            <p>Encounter{" "}{selectedSessionIdx + 1}</p>

            <p>Outcome:{" " + session.outcome}</p>
            <p>{session.encounterLengthSec
              ? (() => {
                  const totalMs = session.encounterLengthSec * 1000;
                  const minutes = Math.floor(totalMs / 60000);
                  const seconds = Math.floor((totalMs % 60000) / 1000);
                  const milliseconds = ((totalMs % 1000) / 1000).toFixed(1).slice(2);
                  return `Duration: ${minutes}:${seconds.toString().padStart(2, '0')},${milliseconds} min`;
                })()
              : ''}</p>
            <p>Date:{" " + session.dayNumber}/{session.monthNumber}/{session.year}</p>
            <p>{players.length + " "}man</p>

      </div>
        <ColoredAreaChart shadows={false} dataPoints={sessionRaidGraphPoints} name={"dps"} color="#ff0000" />
        <ColoredAreaChartDamageTaken shadows={false} dataPoints={sessionRaidGraphPointsDamageTaken} color="#00ff00" />
        <SessionSlideBar
        sessionDuration={sessionTime}
        slideTime={slideTime}
        setSlideTime={setSlideTime}
      />
      <table className="metrics-table metrics-table-modern  fadein">
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
                      <div className="metricTable-cell-name-inner"
                      onClick={
                        () => handleSelect("UniqueBreakdownUI", player)}
                        onContextMenu={handleUndo}
                      >
                        {player.meta.ressurectedStatus && <img src={rebirthIcon} className="ressed-icon-img"/>}{!player.meta.aliveStatus && <img src={skillIcon} className="death-icon-img"/>}<p  className={player.meta.aliveStatus ? "" : "deadText"}>{player.identity.name ? player.identity.name : "-"}</p>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                      <div className="metricTable-percent-bar-wrap fadein"
                        onClick={() => handleSelect("DamageDoneUI", player)}
                        onContextMenu={handleUndo}>
                        <div className="metricTable-percent-bar metricTable-percent-damageDone-color fadein"  
                        style={
                          player.combatStats.dps !== "0"
                            ? { width: `${Math.max(DmgDonepercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein">
                        {player.combatStats.dps && player.combatStats.dps !== "0"  ? player.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein"
                      onClick={() => handleSelect("DamageDoneUI", player)}
                      onContextMenu={handleUndo}
                    >
                    
                        
                        <span className="metricTable-cell-text">
                        {player.combatStats.totalDamage && player.combatStats.totalDamage !== "0" ? player.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                     
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageTaken-color fadein"   
                        style={
                          player.combatStats.damageTaken !== 0
                            ? { width: `${Math.max(DmgTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("DamageTakenUI", player)}
                      onContextMenu={handleUndo}
                      >
                        {player.combatStats.damageTaken ? player.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingTakenUI", player)}
                      onContextMenu={handleUndo}
                      >
                        {player.combatStats.healingTaken ? player.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span  className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("AbosrbsTakenUI", player)}
                      onContextMenu={handleUndo}
                      >
                        {player.combatStats.totalAbsorbedTaken ? player.combatStats.totalAbsorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingDoneUI", player)}
                      onContextMenu={handleUndo}
                      >
                        {player.combatStats.hps && player.combatStats.hps !== "0" ? player.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingDoneUI", player)}
                      onContextMenu={handleUndo}
                      >
                        {player.combatStats.totalHealingDone ? player.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                    </td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("InterruptsUI", player)}
                      onContextMenu={handleUndo}
                      >
                      {player.interrupts ? player.interrupts : "-"}
                    </td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("FDispelsUI", player)}
                      onContextMenu={handleUndo}
                      >{player.dispels ? player.dispels : "-"}</td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("PurgesUI", player)}
                      onContextMenu={handleUndo}
                      >
                      {player.purges ? player.purges : "-"}</td>
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
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("DamageDoneUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.dps && pet.combatStats.dps !== "0"  ? pet.combatStats.dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                    
                        
                        <span className="metricTable-cell-text" 
                    onClick={
                      () => handleSelect("DamageDoneUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.totalDamage && pet.combatStats.totalDamage !== "0" ? pet.combatStats.totalDamage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                     
                    </td>
                    <td className="metricTable-header-text metricTable-damage-cell fadein">
                      <div className="metricTable-percent-bar-wrap fadein">
                        <div className="metricTable-percent-bar metricTable-percent-damageTaken-color fadein"   
                        style={
                          pet.combatStats.damageTaken !== 0
                            ? { width: `${Math.max(DmgTakenpercent * 95, 7)}%` }
                            : {}
                        }></div>
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("DamageTakenUI", pet)}
                      onContextMenu={handleUndo}
                      >{pet.combatStats.damageTaken ? pet.combatStats.damageTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingTakenUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.healingTaken ? pet.combatStats.healingTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span  className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingTakenUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.totalAbsorbedTaken ? pet.combatStats.totalAbsorbedTaken.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
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
                        <span className="metricTable-damage-bar-label metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingDoneUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.hps && pet.combatStats.hps !== "0" ? pet.combatStats.hps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                      </div>
                    </td>
                    <td className="metricTable-header-text fadein">
                        <span className="metricTable-cell-text fadein" 
                    onClick={
                      () => handleSelect("HealingDoneUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.combatStats.totalHealingDone ? pet.combatStats.totalHealingDone.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "-"}</span>
                    </td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("InterruptsUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.interrupts ? pet.interrupts : "-"}</td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("FDispelsUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.dispels ? pet.dispels : "-"}</td>
                    <td className="metricTable-header-text fadein" 
                    onClick={
                      () => handleSelect("PurgesUI", pet)}
                      onContextMenu={handleUndo}
                      >
                      {pet.purges ? pet.purges : "-"}</td>
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
                    onClick={
                      () => handleSelect("PurgesUI", item)}
                      onContextMenu={handleUndo}
                      
                    >
                        {opts.showCollapse && <button className="small-inline-btn" onClick={
                          (e) => {
                            e.stopPropagation();
                            toggleGroup(opts.groupName);
                          }}>
                            -
                            </button>}
                        {opts.showExpand && <button className="small-inline-btn" onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(opts.groupName);
                          }}>
                            {`+ (${opts.count})`}
                            </button>}
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
                          item.combatStats?.hps !== 0
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
}



































































{selectedScene === "DamageDoneUI" && loading !== true && selectedEntityData &&
<div className="core-ui-content" onContextMenu={(e) => {handleUndo(e); hideTooltip()}}>


<table className="damage-table modern">
  <thead>
    <tr>
      <th style={{ width: "6px" }}></th>
      <th>Spell</th>
      <th style={{ textAlign: "center" }}>Total</th>
      <th style={{ textAlign: "center" }}>%</th>
      <th style={{ textAlign: "center" }}>Normal</th>
      <th style={{ textAlign: "center" }}>Critical</th>
      <th style={{ textAlign: "center" }}>Avoided</th>
      <th style={{ textAlign: "center" }}>Lowered</th>
    </tr>
  </thead>

  <tbody>

    {/* ===================== SUMMARY ROW ===================== */}
    {selectedEntityData.totals && (
      <tr className="modern-row summary-row">
        {/* Empty color bar */}
        <td></td>

        {/* Title */}
        <td className="cell"
        ><strong>Total</strong></td>

        {/* Total Damage */}
        <td className="cell"
        onMouseEnter={() =>
            showTooltip(
              <>
                <strong>Total Damage</strong>
                <div className="tip-sub">Physical: {`${selectedEntityData.totals.totalPhysicalDamage || 0} (${Number(
                  (selectedEntityData.totals.totalPhysicalDamage * 100 /
                   selectedEntityData.totals.totalDamage)
                ).toFixed(
                  ((selectedEntityData.totals.totalPhysicalDamage * 100 /
                     selectedEntityData.totals.totalDamage) % 1 === 0) ? 0 : 2
                )}%)`} </div>
                <div className="tip-sub">Magical: {`${selectedEntityData.totals.totalMagicalDamage || 0} (${Number(
                  (selectedEntityData.totals.totalMagicalDamage * 100 /
                   selectedEntityData.totals.totalDamage)
                ).toFixed(
                  ((selectedEntityData.totals.totalMagicalDamage * 100 /
                     selectedEntityData.totals.totalDamage) % 1 === 0) ? 0 : 2
                )}%)`} </div>
              </>
            )
          }
        onMouseLeave={hideTooltip}
              >{selectedEntityData.totals.totalDamage}</td>
      
        {/*Percentage of Damage*/}
        <td className="cell">{(selectedEntityData.totals.totalDamage * 100/selectedEntityData.totals.totalDamage)
                .toFixed((selectedEntityData.totals.totalDamage % 1 === 0) ? 0 : 2)}%</td>
        {/* Normal Hits */}
        <td className="cell"
        onMouseEnter={() =>
            showTooltip(
              <>
                <strong>Normal</strong>
                <div className="tip-sub">Hits: {`${selectedEntityData.totals.normalCount || 0}/${selectedEntityData.totals.hitTable.realHitCount} (${Number(
                  (selectedEntityData.totals.normalCount * 100 /
                   selectedEntityData.totals.hitTable.realHitCount)
                ).toFixed(
                  ((selectedEntityData.totals.normalCount * 100 /
                     selectedEntityData.totals.hitTable.realHitCount) % 1 === 0) ? 0 : 2
                )}%)`} </div>
                <div className="tip-sub">Min: {selectedEntityData.totals.minNormal || 0}</div>
                <div className="tip-sub">Avg: {selectedEntityData.totals.avgNormal || 0}</div>
                <div className="tip-sub">Max: {selectedEntityData.totals.maxNormal || 0}</div>
              </>
            )
          }
        onMouseLeave={hideTooltip}
              >{Number(
                  (selectedEntityData.totals.normalCount * 100 /
                   selectedEntityData.totals.hitTable.realHitCount)
                ).toFixed(
                  ((selectedEntityData.totals.normalCount * 100 /
                     selectedEntityData.totals.hitTable.realHitCount) % 1 === 0) ? 0 : 2
                )}%</td>

        {/* Crit Hits */}
        <td className="cell"
        onMouseEnter={() =>
            showTooltip(
              <>
                <strong>Hits</strong>
                <div className="tip-sub">Crit: {`${selectedEntityData.totals.critCount || 0}/${selectedEntityData.totals.hitTable.realHitCount} (${Number(
                  (selectedEntityData.totals.critCount * 100 /
                   selectedEntityData.totals.hitTable.realHitCount)
                ).toFixed(
                  ((selectedEntityData.totals.critCount * 100 /
                     selectedEntityData.totals.hitTable.realHitCount) % 1 === 0) ? 0 : 2
                )}%)`} </div>
                <div className="tip-sub">Min: {selectedEntityData.totals.minCrit || 0}</div>
                <div className="tip-sub">Avg: {selectedEntityData.totals.avgCrit || 0}</div>
                <div className="tip-sub">Max: {selectedEntityData.totals.maxCrit || 0}</div>
              </>
            )
          }
        onMouseLeave={hideTooltip}
              >{Number(
                  (selectedEntityData.totals.critCount * 100 /
                   selectedEntityData.totals.hitTable.realHitCount)
                ).toFixed(
                  ((selectedEntityData.totals.critCount * 100 /
                     selectedEntityData.totals.hitTable.realHitCount) % 1 === 0) ? 0 : 2
                )}%</td>

        {/* Avoided */}
        <td className="cell"
        onMouseEnter={() =>
            showTooltip(
              <>
                <strong>Crit</strong>
                <div className="tip-sub">Miss: {(() => {
                  const tot = selectedEntityData.totals;
                                
                  const totalRolls =
                    tot.missCount +
                    tot.dodgeCount +
                    tot.parryCount +
                    tot.resistCount +
                    tot.blockCount +
                    tot.deflectCount +
                    tot.immuneCount +
                    tot.hitCount;
                                
                  const misses = tot.missCount;
                  const missPct = totalRolls > 0 ? (misses / totalRolls) * 100 : 0;
                                
                  return `${misses}/${totalRolls} (${missPct.toFixed(missPct % 1 === 0 ? 0 : 2)}%)`;
                })()} </div>
                <div className="tip-sub">Min: {selectedEntityData.totals.minCrit || 0}</div>
                <div className="tip-sub">Avg: {selectedEntityData.totals.avgCrit || 0}</div>
                <div className="tip-sub">Max: {selectedEntityData.totals.maxCrit || 0}</div>
              </>
            )
          }
        onMouseLeave={hideTooltip}
        >
          {selectedEntityData.totals.missCount +
           selectedEntityData.totals.dodgeCount +
           selectedEntityData.totals.parryCount +
           selectedEntityData.totals.resistCount +
           selectedEntityData.totals.blockCount +
           selectedEntityData.totals.deflectCount +
           selectedEntityData.totals.immuneCount}
        </td>

        {/* Lowered */}
        <td className="cell">
          {selectedEntityData.totals.absorbed +
           selectedEntityData.totals.blockedAmount +
           selectedEntityData.totals.resistedAmount}
        </td>
      </tr>
    )}

    {/* ===================== SPELL ROWS ===================== */}
    {(() => {
      const spellsArray = Array.isArray(selectedEntityData.spells)
        ? selectedEntityData.spells.slice()
        : (selectedEntityData.spells ? Object.values(selectedEntityData.spells) : []);
      // sort descending by totalDamage
      spellsArray.sort((a, b) => (Number(b.totalDamage) || 0) - (Number(a.totalDamage) || 0));
      return spellsArray.map((sp) => {
        const schoolColor =
          SPELL_SCHOOL_COLORS[sp.school] || SPELL_SCHOOL_COLORS.Unknown;

        const avoidedTotal =
          sp.missCount + sp.dodgeCount + sp.parryCount +
          sp.resistCount + sp.blockCount + sp.deflectCount + sp.immuneCount;

        const loweredTotal =
          sp.absorbAmount + sp.blockedTotal + sp.resistedTotal;

        return (
          <tr key={sp.id} className="modern-row">

            {/* Left color bar */}
            <td className="color-bar" style={{ backgroundColor: schoolColor.bg }} />

            {/* SPELL NAME */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>{sp.name}</strong>
                    <div className="tip-sub">SpellID: {sp.id}</div>
                    <div className="tip-sub">School: {sp.school}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {sp.name}
            </td>

            {/* TOTAL DAMAGE */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>Total Damage</strong>
                    <div className="tip-sub">Physical: {sp.physicalDamage || 0}</div>
                    <div className="tip-sub">Magical: {sp.magicalDamage || 0}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {sp.totalDamage}
            </td>
            {/* PERCENTAGE OF TOTAL DAMAGE */}
            <td className="cell">
              {(sp.totalDamage * 100 / selectedEntityData.totals.totalDamage)
                .toFixed(((sp.totalDamage * 100 / selectedEntityData.totals.totalDamage) % 1 === 0) ? 0 : 1)}%
            </td>
            {/* NORMAL HITS */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>Normal Hits: {sp.normalCount}</strong>
                    <div className="tip-sub">Min: {sp.minNormal}</div>
                    <div className="tip-sub">Avg: {sp.avgNormal}</div>
                    <div className="tip-sub">Max: {sp.maxNormal}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {sp.normalCount}
            </td>

            {/* CRITICAL */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>Critical Hits: {sp.critCount}</strong>
                    <div className="tip-sub">Min: {sp.minCrit}</div>
                    <div className="tip-sub">Avg: {sp.avgCrit}</div>
                    <div className="tip-sub">Max: {sp.maxCrit}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {sp.critCount}
            </td>

            {/* AVOIDED */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>Avoided: {avoidedTotal}</strong>
                    <div className="tip-sub">Miss: {sp.missCount}</div>
                    <div className="tip-sub">Dodge: {sp.dodgeCount}</div>
                    <div className="tip-sub">Parry: {sp.parryCount}</div>
                    <div className="tip-sub">Resist: {sp.resistCount}</div>
                    <div className="tip-sub">Block: {sp.blockCount}</div>
                    <div className="tip-sub">Deflect: {sp.deflectCount}</div>
                    <div className="tip-sub">Immune: {sp.immuneCount}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {avoidedTotal}
            </td>

            {/* LOWERED */}
            <td
              className="cell tooltip-target"
              onMouseEnter={() =>
                showTooltip(
                  <>
                    <strong>Lowered: {loweredTotal}</strong>
                    <div className="tip-sub">Absorbed: {sp.absorbAmount}</div>
                    <div className="tip-sub">Blocked: {sp.blockedTotal}</div>
                    <div className="tip-sub">Resisted: {sp.resistedTotal} {`(${(sp.resistedTotal/(sp.totalDamage + sp.resistedTotal) * 100).toFixed(2)}%)`}</div>
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              {loweredTotal}
            </td>

          </tr>
        );
      });
    })()}

  </tbody>
</table>


      {/* === GLOBAL CURSOR TOOLTIP === */}
      






</div>
}



































































































      {tooltip.visible && (
        <div className="cursor-tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
          {tooltip.content}
        </div>
      )}

      {loading && (
        <div className="loader-wrapper">
          <div className="loader"></div>
          <p className="loader-text">Loading...</p>
        </div>
      )}
    
    </div>
  );
}
