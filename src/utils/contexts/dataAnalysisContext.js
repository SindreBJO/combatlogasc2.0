import React, { createContext, useEffect, useState, useContext } from 'react'
import { DataContext } from '../../utils/contexts/dataContext';

export const AnalysisContext = createContext();


export const AnalysisContextProvider = ({ children }) => {
    const { data } = useContext(DataContext);
    
    useEffect(() => {
        console.log("AnalysisContextProvider initialized with data:", data);
    }, []);
    const getDamageDone = (entityName, startIndex, endIndex, flagType) => {
        if (!data.data || !data.sessions) return 0;
        const entityData = data.data.filter(obj => 
            (obj.sourceName === entityName) && 
            (obj.sourceFlag === flagType)
        );
        console.log(entityData);
    }

    return (
        <AnalysisContext.Provider value={{ getDamageDone }}>
            {children}
        </AnalysisContext.Provider>
    );

    
}