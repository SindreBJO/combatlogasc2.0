import React from "react";
import "./alphaDisclaimer.css";

export default function AlphaDisclaimerModal({ onAgree }) {
  return (
    <div className="alpha-overlay">
      <div className="alpha-modal">
        <h2>Disclaimer - Alpha Version</h2>

        <ul>
          <li>You may encounter bugs or crashes.</li>
          <li>Features may be incomplete or change without notice.</li>
          <li>Stability and visuals are not final.</li>
          <li>Phone/tablet design is incomplete.</li>
        </ul>
        <h2>Important to know:</h2>
        <ul>
          <li>Due to github limitations, some features may not work as expected for exmaple URL doesnt matter during the alpha phase. This will change later.</li>
          <li>The link you clicked "start the app".</li>
          <li>If you at any point refresh the page, the "app is closed" and you have to click the link again. Refreshing the page will not work/do anything.</li>
        </ul>

        <p className="agreement">
          By continuing, you aknowledge the above and decide to use the alpha version “as-is”.
          For dev updates and news, join <a href="https://discord.gg/GmeSCJGdzs" target="_blank" rel="noreferrer">Szylers Addons Discord</a>.
        </p>

        <div className="buttons">
          <button className="agree-btn" onClick={onAgree}>Agree & Continue</button>
        </div>
      </div>
    </div>
  );
}
