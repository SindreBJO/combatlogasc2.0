import React from "react"
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/header/header.js';
import Home from './pages/Home.js';
import Error from './pages/error.js';
import UserManual from "./pages/user-manual.js";
import NewSession from "./pages/new-session.js";
import CurrentSession from "./pages/current-session.js";


export default function App() {

  return (
      <div className='app'>
        <Header/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/NewSession" element={<NewSession/>}/>
          <Route path="/CurrentSession" element={<CurrentSession/>}/>
          <Route path="/UserManual" element={<UserManual/>}/>
          <Route path="/*" element={<Error/>}/>
        </Routes>
      </div>
  );
}