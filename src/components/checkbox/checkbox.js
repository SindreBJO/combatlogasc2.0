import React from "react";
import "./checkbox.css";

export default function CheckBox({ name, state, setState }) {

  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={state}
        onChange={() => setState(!state)}
      />
      <span className="checkmark" />
      <span className="label-text">{name}</span>
    </label>
  );
}