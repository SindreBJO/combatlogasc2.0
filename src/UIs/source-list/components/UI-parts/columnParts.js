import "./columParts.css";
import React, {useContext} from "react"

export default function columnParts() {
   
    return ( 
            <div className="columnParts-wrapper">
                <div className="columnParts columnParts-name" style={{width: "16%"}}></div>
                <div className="columnParts columnParts-dps" style={{width: "8%"}}></div>
                <div className="columnParts columnParts-damageDone"></div>
                <div className="columnParts columnParts-damageTaken"></div>
                <div className="columnParts columnParts-mitigation"></div>
                <div className="columnParts columnParts-absorbDone"></div>
                <div className="columnParts columnParts-effectiveHealing"></div>
                <div className="columnParts columnParts-healingTaken"></div>
            </div>
    )
}