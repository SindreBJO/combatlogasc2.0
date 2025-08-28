import React from "react"
import WoWCombatMetrics from "../containers/table"
import Timeline from "../containers/timeline/timeline"


export default function CurrentSession(){

  return (
    <div className='main'>
      <WoWCombatMetrics />
      <Timeline />
    </div>
  )
}