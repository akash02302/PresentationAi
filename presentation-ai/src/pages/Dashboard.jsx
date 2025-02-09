import { useState } from 'react'
import '../styles/Dashboard.css'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [presentations, setPresentations] = useState([])

  return (
    <div className="dashboard">
      <h1>My Presentations</h1>
      {presentations.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any presentations yet.</p>
          <Link to="/" className="create-btn">Create Your First Presentation</Link>
        </div>
      ) : (
        <div className="presentations-grid">
          {presentations.map(presentation => (
            <div key={presentation.id} className="presentation-card">
              {/* Presentation card content */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard 