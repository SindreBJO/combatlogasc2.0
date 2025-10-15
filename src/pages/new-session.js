import React, { useState, useContext} from "react"
import Fileloader from "../components/loader/fileLoader.js";
import { DataContext } from "../utils/contexts/dataContext.js";
import PerformanceMetricsTable from "../containers/table.js";



export default function NewSession(){

  const { finishedParsing } = useContext(DataContext);

  return (
    <div className="main">
      {!finishedParsing && <Fileloader/>}
      { finishedParsing && <PerformanceMetricsTable/>}
    </div>
  )
}