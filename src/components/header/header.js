import NavButton from "../buttons/navButton.js";
import "./header.css";

export default function Header() {
   

    return (
        <header>
            <h1 className="header-title">Combatlog 3.3.5</h1>
            <nav className="nav">
                <ul className="nav-list">
                    <li className="nav-element"><NavButton type={"Home"} page={""}/></li>
                    <li className="nav-element"><NavButton type={"Session"} page={"session"}/></li>
                    <li className="nav-element"><NavButton type={"User Manual"} page={"UserManual"}/></li>

                </ul>
            </nav>
        </header>
    )
        
}
