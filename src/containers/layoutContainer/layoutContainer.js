import React from "react";
import './layoutContainer.css';
import NavButton from "../../components/buttons/navButton";

export default function LayoutContainer ({ children }) {
  return (
    <div className="menu-container">
        <NavButton type="Filedrop" page="Filedrop" />
        <NavButton type="Graph" page="Graph" />
        <NavButton type="Table" page="Table" />
    </div>
  );
};
