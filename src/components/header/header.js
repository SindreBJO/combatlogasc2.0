import NavButton from "../buttons/navButton.js";
import "./header.css";

export default function Header() {
   

    return (
        <header>
            <h1 className="header-title">Combatlog.Asc</h1>
            <nav className="nav">
                <ul className="nav-list">
                    <li className="nav-element"><NavButton type={"Home"} page={""}/></li>
                    <li className="nav-element"><NavButton type={"New Session"} page={"NewSession"}/></li>
                    <li className="nav-element"><NavButton type={"Current Session"} page={"CurrentSession"}/></li>
                    <li className="nav-element"><NavButton type={"User Manual"} page={"UserManual"}/></li>
                </ul>
            </nav>
        </header>
    )
        
}
