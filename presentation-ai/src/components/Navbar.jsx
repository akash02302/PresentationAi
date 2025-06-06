import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import '../styles/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="navbar">
      <div className="logo">
        <Link to="/home" className="logo-link">PresentationAI</Link>
      </div>
      <nav className="nav-links">
        <Link 
          to="/templates" 
          className={`nav-link ${location.pathname === '/templates' ? 'active' : ''}`}
        >
          Templates
        </Link>
        <Link 
          to="/home" 
          className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/dashboard" 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <button className="sign-out-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>
    </div>
  );
}

export default Navbar; 