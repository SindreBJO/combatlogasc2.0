
import "./source-list.css";

export default function SourceList() {
   
    return (
        <div className="source-list-wrapper">
            <div className="column-header-wrapper">
                <div className="culumn-header-content" style={{width: "16%"}}><h3 className="column-header">Name</h3></div>
                <div className="culumn-header-content" style={{width: "8%"}}><h3 className="column-header">DPS</h3></div>
                <div className="culumn-header-content"><h3 className="column-header">Damage Done</h3></div>
                <div className="culumn-header-content"><h3 className="column-header">Damage Taken</h3></div>
                <div className="culumn-header-content"><h3 className="column-header">Mitigation</h3></div>
                <div className="culumn-header-content"><h3 className="column-header">Absorb Done</h3></div>
                <div className="culumn-header-content"><h3 className="column-header">Effective Healing</h3></div>
                <div className="culumn-header-content" style={{borderRight: "2px solid black"}}><h3 className="column-header">Healing Taken</h3></div>
            </div>
        </div>
    )
        
}