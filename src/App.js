import React from "react"
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/header/header.js';
import Home from './pages/Home.js';
import Error from './pages/error.js';
import UserManual from "./pages/user-manual.js";
import NewSession from "./pages/new-session.js";
import CurrentSession from "./pages/current-session.js";
import LayoutContainer from "./containers/layoutContainer/layoutContainer.js";


export default function App() {

  return (
      <div className='app'>
        <Header/>
        <LayoutContainer/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/Filedrop" element={<NewSession/>}/>
          <Route path="/Table" element={<CurrentSession/>}/>
          <Route path="/Graph" element={<UserManual/>}/>
          <Route path="/*" element={<Error/>}/>
        </Routes>
      </div>
  );
}