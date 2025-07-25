import React from "react"
import SourceList from "../UIs/source-list/source-list"
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