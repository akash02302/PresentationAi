import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import googleIcon from '../assets/google.svg';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/home');
      toast.success('Successfully logged in with Google!');
    } catch (error) {
      toast.error('Failed to login with Google');
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Sign in to your account</h1>
        <p className="subtitle">
          Create professional presentations from videos,text, or documents in seconds.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-button">
            Sign in with Email
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button onClick={handleGoogleLogin} className="google-button">
          <img 
            src={googleIcon}
            alt="Google Logo" 
            className="google-icon" 
          />
          Continue with Google
        </button>

        <p className="signup-text">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      <div className="testimonial">
        <p className="quote">
          PresentationAI has revolutionized how I create presentations. The AI-powered slide generation saves me hours of work and produces amazing results.
        </p>
        <div className="author">
          <p className="name">Akash Kumar</p>
          <p className="title">Developer</p>
        </div>
      </div>
    </div>
  );
}

export default Login; 