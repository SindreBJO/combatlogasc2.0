import "./buttons.css"
import { Link } from 'react-router-dom'


export default function NavButton({ type, page }) {

  return (
    <Link className='nav-button' to={`/${page}`}>
      {type}
    </Link>
  );
}