import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './firebase/config'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './components/Login'
import SignUp from './components/SignUp'
import LoadingSpinner from './components/LoadingSpinner'
import ForgotPassword from './components/ForgotPassword'
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <div className="app">
          {user && <Navbar />}
          <main className="main-content">
            <Routes>
              {/* Default route */}
              <Route 
                path="/" 
                element={user ? <Navigate to="/home" /> : <Login />} 
              />

              {/* Auth routes */}
              <Route 
                path="/login" 
                element={user ? <Navigate to="/home" /> : <Login />} 
              />
              <Route 
                path="/signup" 
                element={user ? <Navigate to="/home" /> : <SignUp />} 
              />

              {/* Protected routes */}
              <Route 
                path="/home" 
                element={user ? <Home /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/login" />} 
              />

              {/* Forgot Password route */}
              <Route 
                path="/forgot-password" 
                element={user ? <Navigate to="/home" /> : <ForgotPassword />} 
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </>
  )
}

export default App