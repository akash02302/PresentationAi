import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import '../styles/Navbar.css';

function Navbar() {
  const navigate = useNavigate();

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
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <button className="sign-out-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>
    </div>
  );
}

export default Navbar; 