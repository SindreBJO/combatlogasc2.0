import React, { createContext, useState } from 'react';

export const SelectedContext = createContext();

export default function SelectedContextProvider({ children }) {
    const [selectedPage, setSelectedPage] = useState('homepage');
    const [burgerMenuPressed, setBurgerMenuPressed] = useState(false);

    return (
        <SelectedContext.Provider value={{ selectedPage, setSelectedPage, burgerMenuPressed, setBurgerMenuPressed }}>
            {children}
        </SelectedContext.Provider>
    );
}