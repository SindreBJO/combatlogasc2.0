import NavButton from "../buttons/navButton.js";
import { Link } from "react-router-dom";
import "./header.css";

export default function Header() {
   

    return (
        <header>
            <Link to="/combatlogasc2.0/" className="header-title"><h1>Combatlog 3.3.5</h1></Link>
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
